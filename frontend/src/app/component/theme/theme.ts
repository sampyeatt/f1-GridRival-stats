import {definePreset} from '@primeuix/themes'
import Aura from '@primeuix/themes/nora'

export const DarkMode = definePreset(Aura, {
  semantic: {
    colorScheme: {
      dark: {
        formField: {
          hoverBorderColor: '{red.800}'

        },
        primary: {
          50: '{red.50}',
          100: '{red.100}',
          200: '{red.200}',
          300: '{red.300}',
          400: '{red.400}',
          500: '{red.500}',
          600: '{red.600}',
          700: '{red.700}',
          800: '{red.800}',
          900: '{red.900}',
          950: '{red.950}'
        }
      }
    }

  },
  components: {
    button: {
      extend: {
        accent: {
          color: '{red-600}'
        }
      }, root: {
        raisedShadow: '0 6px 2px -4px rgba(0, 0, 0, 0.2), 0 4px 4px 0 rgba(0, 0, 0, 0.14), 0 2px 10px 0 rgba(0, 0, 0, 0.12)',
        roundedBorderRadius: '.3rem'
      }

    }
  },
  card: {
    colorScheme: {
      dark: {
        root: {
          background: '{surface.500}',
          color: '{surface.0}'
        },
        subtitle: {
          color: '{surface.400}'
        }
      }
    }
  }
})
