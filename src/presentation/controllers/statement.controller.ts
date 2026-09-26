import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestStatementDto } from '../../core/transfer-bank/application/dto/request-statement.dto';
import { DOWNLOAD_STATEMENT_USE_CASE, IDownloadStatementUseCase } from '../../core/transfer-bank/application/ports/download-statement.port';
import { GENERATE_STATEMENT_USE_CASE, IGenerateStatementUseCase } from '../../core/transfer-bank/application/ports/generate-statement.port';
import { GET_STATEMENT_STATUS_USE_CASE, IGetStatementStatusUseCase } from '../../core/transfer-bank/application/ports/get-statement-status.port';
import { User } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedUser } from '../types/authenticated-user.type';

@ApiTags('statements')
@ApiBearerAuth('JWT-auth')
@Controller('statements')
@UseGuards(JwtAuthGuard)
export class StatementController {
  private readonly logger = new Logger(StatementController.name);

  constructor(
    @Inject(GENERATE_STATEMENT_USE_CASE)
    private readonly generateStatementUseCase: IGenerateStatementUseCase,
    @Inject(GET_STATEMENT_STATUS_USE_CASE)
    private readonly getStatementStatusUseCase: IGetStatementStatusUseCase,
    @Inject(DOWNLOAD_STATEMENT_USE_CASE)
    private readonly downloadStatementUseCase: IDownloadStatementUseCase,
  ) { }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Solicitar estado de cuenta (PDF asíncrono)' })
  @ApiResponse({ status: 202, description: 'Statement encolado' })
  async requestStatement(
    @Body() dto: RequestStatementDto,
    @User() user: AuthenticatedUser,
  ) {
    this.logger.log(`User ${user.email} requested statement for ${dto.accountNumber}`);
    return this.generateStatementUseCase.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar estado del statement' })
  @ApiResponse({ status: 200, description: 'Estado del statement' })
  async getStatementStatus(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ) {
    this.logger.log(`User ${user.email} checking statement ${id}`);
    return this.getStatementStatusUseCase.execute(id, user.id, user.role);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Descargar PDF del statement' })
  @ApiResponse({ status: 200, description: 'PDF descargado' })
  @ApiResponse({ status: 400, description: 'Statement no está listo' })
  @ApiResponse({ status: 404, description: 'Statement no encontrado' })
  async downloadStatement(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<StreamableFile> {
    this.logger.log(`User ${user.email} downloading statement ${id}`);

    const { stream, fileName, contentType } = await this.downloadStatementUseCase.execute(
      id,
      user.id,
      user.role,
    );

    // StreamableFile it's a NestJS class, not an Express one.
    return new StreamableFile(stream, {
      type: contentType,
      disposition: `attachment; filename="${fileName}"`,
    });
  }
}