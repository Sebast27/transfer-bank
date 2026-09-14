import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { IGenerateStatementUseCase, GENERATE_STATEMENT_USE_CASE } from '../../core/transfer-bank/application/ports/generate-statement.port';
import { IStatementRepository, STATEMENT_REPOSITORY } from '../../core/transfer-bank/domain/ports/statement-repository.port';
import { RequestStatementDto } from '../../core/transfer-bank/application/dto/request-statement.dto';

@Controller('statements')
@UseGuards(JwtAuthGuard)
export class StatementController {
  constructor(
    @Inject(GENERATE_STATEMENT_USE_CASE)
    private readonly generateStatementUseCase: IGenerateStatementUseCase,
    @Inject(STATEMENT_REPOSITORY)
    private readonly statementRepository: IStatementRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async requestStatement(@Body() dto: RequestStatementDto, @User() user: any) {
    console.log(`User ${user.email} requested statement for ${dto.accountNumber}`);
    return this.generateStatementUseCase.execute(dto);
  }

  @Get(':id')
  async getStatementStatus(@Param('id') id: string, @User() user: any) {
    console.log(`User ${user.email} checking statement ${id}`);
    const statement = await this.statementRepository.findById(id);

    if (!statement) {
      return { message: 'Statement not found', statusCode: 404 };
    }

    return statement;
  }
}