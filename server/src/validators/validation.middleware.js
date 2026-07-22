export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Assign validated data back safely for Express 5 compatibility
    if (parsed.body !== undefined) {
      req.body = parsed.body;
    }
    
    if (parsed.query !== undefined) {
      req.validatedQuery = parsed.query;
      if (req.query && typeof req.query === "object") {
        try {
          Object.assign(req.query, parsed.query);
        } catch (_) {
          // Express 5 getter-only property fallback
        }
      }
    }
    
    if (parsed.params !== undefined) {
      req.validatedParams = parsed.params;
      if (req.params && typeof req.params === "object") {
        try {
          Object.assign(req.params, parsed.params);
        } catch (_) {
          // Express 5 getter-only property fallback
        }
      }
    }
    
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
