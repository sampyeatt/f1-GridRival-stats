// Runs before any test module is imported. auth.util captures JWT_SECRET at
// module scope, so it has to be set before that import happens.
process.env.JWT_SECRET ??= 'test-secret-not-used-outside-tests'
