import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'

// sequelize-typescript relies on emitDecoratorMetadata, which esbuild (Vitest's
// default transformer) does not implement. SWC does, so any test that imports a
// model transitively still compiles.
export default defineConfig({
    plugins: [
        swc.vite({
            module: { type: 'es6' },
            jsc: {
                target: 'es2022',
                parser: { syntax: 'typescript', decorators: true },
                transform: { legacyDecorator: true, decoratorMetadata: true }
            }
        })
    ],
    test: {
        include: ['test/**/*.test.ts'],
        setupFiles: ['test/setup.ts'],
        environment: 'node',
        coverage: { provider: 'v8', include: ['src/services/**', 'src/shared/**'] }
    }
})
