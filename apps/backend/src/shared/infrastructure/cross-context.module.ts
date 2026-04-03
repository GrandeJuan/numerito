import { Module, Global } from '@nestjs/common';
import { ESTUDIO_LOOKUP_SERVICE } from '../../iam/application/services/estudio-lookup.service';
import { ESTUDIO_REPOSITORY } from '../../estudio/domain/repositories/estudio.repository';
import type { EstudioRepository } from '../../estudio/domain/repositories/estudio.repository';
import { EstudioModule } from '../../estudio/estudio.module';

@Global()
@Module({
  imports: [EstudioModule],
  providers: [
    {
      provide: ESTUDIO_LOOKUP_SERVICE,
      useFactory: (repo: EstudioRepository) => ({
        findById: async (id: string) => {
          const estudio = await repo.findById(id);
          if (!estudio) return null;
          return { id: estudio.id, nombre: estudio.nombre.value };
        },
      }),
      inject: [ESTUDIO_REPOSITORY],
    },
  ],
  exports: [ESTUDIO_LOOKUP_SERVICE],
})
export class CrossContextModule {}
