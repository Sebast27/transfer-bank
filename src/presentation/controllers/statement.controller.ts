import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { RequestStatementDto } from '../../core/transfer-bank/application/dto/request-statement.dto';
import { GENERATE_STATEMENT_USE_CASE, IGenerateStatementUseCase } from '../../core/transfer-bank/application/ports/generate-statement.port';
import { IStatementRepository, STATEMENT_REPOSITORY } from '../../core/transfer-bank/domain/ports/statement-repository.port';
import { User } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('statements')
@ApiBearerAuth('JWT-auth')
@Controller('statements')
@UseGuards(JwtAuthGuard)
export class StatementController {
  constructor(
    @Inject(GENERATE_STATEMENT_USE_CASE)
    private readonly generateStatementUseCase: IGenerateStatementUseCase,
    @Inject(STATEMENT_REPOSITORY)
    private readonly statementRepository: IStatementRepository,
  ) { }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Solicitar estado de cuenta (PDF asíncrono)' })
  @ApiResponse({ status: 202, description: 'Statement encolado' })
  async requestStatement(@Body() dto: RequestStatementDto, @User() user: any) {
    console.log(`User ${user.email} requested statement for ${dto.accountNumber}`);
    return this.generateStatementUseCase.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar estado del statement' })
  @ApiResponse({ status: 200, description: 'Estado del statement' })
  async getStatementStatus(@Param('id') id: string, @User() user: any) {
    console.log(`User ${user.email} checking statement ${id}`);
    const statement = await this.statementRepository.findById(id);

    if (!statement) {
      throw new NotFoundException('Statement not found');
    }

    return statement;
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Descargar PDF del statement' })
  @ApiResponse({ status: 200, description: 'PDF descargado' })
  @ApiResponse({ status: 400, description: 'Statement no está listo' })
  @ApiResponse({ status: 404, description: 'Statement no encontrado' })
  async downloadStatement(
    @Param('id') id: string,
    @User() user: any,
    @Res() res: Response,
  ) {
    console.log(`User ${user.email} downloading statement ${id}`);

    const statement = await this.statementRepository.findById(id);

    if (!statement) {
      throw new NotFoundException('Statement not found');
    }

    if (statement.status !== 'COMPLETED') {
      throw new BadRequestException(`Statement is not ready. Current status: ${statement.status}`);
    }

    if (!statement.filePath) {
      throw new NotFoundException('Statement file not found');
    }

    if (!fs.existsSync(statement.filePath)) {
      throw new NotFoundException('Statement file does not exist on disk');
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="statement-${statement.id}.pdf"`,
    );

    // Send file
    const fileStream = fs.createReadStream(statement.filePath);
    fileStream.pipe(res);
  }
}