export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Assign validated and parsed data back to express req
    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.query !== undefined) req.query = parsed.query;
    if (parsed.params !== undefined) req.params = parsed.params;
    
    return next();
  } catch (error) {
    if (error.errors) {
      const formattedErrors = error.errors.map((err) => {
        const fieldName = err.path.slice(1).join(".") || err.path[0];
        return `${fieldName}: ${err.message}`;
      });
      
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors,
      });
    }
    return next(error);
  }
};
