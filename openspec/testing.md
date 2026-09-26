# Testing Standards

## Framework
- **Jest** como framework de testing
- **ts-jest** para TypeScript
- **@nestjs/testing** para TestingModule
- **supertest** para E2E

## Estructura de Carpetas

**TODOS los tests van en la carpeta `test/`** en la raíz del proyecto.

test/
├── unit/ # Tests unitarios
│ ├── core/
│ │ ├── auth/
│ │ │ ├── domain/
│ │ │ │ ├── entities/
│ │ │ │ │ └── user.entity.spec.ts
│ │ │ │ └── value-objects/
│ │ │ │ ├── email.vo.spec.ts
│ │ │ │ └── password.vo.spec.ts
│ │ │ └── application/
│ │ │ ├── mappers/
│ │ │ │ └── user.mapper.spec.ts
│ │ │ └── use-cases/
│ │ │ ├── login.use-case.spec.ts
│ │ │ └── register.use-case.spec.ts
│ │ └── transfer-bank/
│ │ ├── domain/
│ │ │ ├── entities/
│ │ │ │ └── transaction.entity.spec.ts
│ │ │ └── value-objects/
│ │ │ └── money.vo.spec.ts
│ │ └── application/
│ │ └── use-cases/
│ │ ├── process-transfer.use-case.spec.ts
│ │ ├── get-transfer-status.use-case.spec.ts
│ │ └── ...
└── e2e/ # Tests end-to-end
├── auth.e2e-spec.ts
├── transfers.e2e-spec.ts
└── ...

## File Naming
- Unit tests: `*.spec.ts` (junto al archivo fuente)
- E2E tests: `*.e2e-spec.ts` (en carpeta test/)
- NO usar `*.test.ts`
- El nombre del test debe coincidir con el archivo fuente

Ejemplo:
- Fuente: `src/core/transfer-bank/domain/value-objects/money.vo.ts`
- Test: `test/unit/core/transfer-bank/domain/value-objects/money.vo.spec.ts`

## Structure
- Usar **Arrange-Act-Assert** pattern
- `describe()` para agrupar, `it()` para casos
- Mocks en `beforeEach`, no en file scope
- `jest.clearAllMocks()` en `afterEach`
- Nombres de tests en **inglés** (convención)

## Mocking
- Mockear TODAS las dependencias via DI con `useValue`
- NO usar `imports` en TestingModule (solo `providers`)
- NO tocar BD real en unit tests
- Usar `jest.fn()` para mocks cuando se usen

## Cobertura
- Mínimo 90% en:
  - Statements
  - Branches
  - Functions
  - Lines
- NO testear: DTOs, modules, configs, main.ts
- Testear métodos con `if/else/switch/throw/catch`
- Testear edge cases (null, undefined, empty, negative, zero)

## Imports
- Usar rutas relativas desde `test/` hacia `src/`
- Ejemplo: `import { Money } from '../../../../src/core/...'`
- O usar alias `@/` si está configurado en jest.config.js

## Ejemplo Completo

**Fuente:** `src/core/transfer-bank/domain/value-objects/money.vo.ts`

**Test:** `test/unit/core/transfer-bank/domain/value-objects/money.vo.spec.ts`

```typescript
describe('ProcessTransferUseCase', () => {
  let useCase: ProcessTransferUseCase;
  let mockRepository: jest.Mocked<ITransactionRepository>;
  let mockQueue: jest.Mocked<IQueuePort>;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };
    mockQueue = { add: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ProcessTransferUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: mockRepository },
        { provide: QUEUE_PORT, useValue: mockQueue },
      ],
    }).compile();

    useCase = module.get(ProcessTransferUseCase);
  });

  it('should transfer successfully', async () => {
    // Arrange
    const dto = { fromAccount: 'A', toAccount: 'B', amount: 100 };
    mockRepository.save.mockResolvedValue({ id: '1', status: 'PENDING' });

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(result.status).toBe('PENDING');
    expect(mockQueue.add).toHaveBeenCalled();
  });
});
```

```typescript
import { Money } from '../../../../../../src/core/transfer-bank/domain/value-objects/money.vo';

describe('Money', () => {
  describe('constructor', () => {
    it('should create a Money object with valid amount', () => {
      // Arrange
      const value = 100;

      // Act
      const money = new Money(value);

      // Assert
      expect(money.getValue()).toBe(value);
    });

    it('should throw error for negative amount', () => {
      // Arrange
      const value = -10;

      // Act & Assert
      expect(() => new Money(value)).toThrow();
    });
  });
});
```



