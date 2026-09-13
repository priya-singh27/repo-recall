const successResponse = (res, data, message) => {
    return res.status(200).json({
      code: 200,
      data,
      message,
    });
  };
  
  const serverErrorResponse = (res, message) => {
    return res.status(500).json({
      code: 500,
      message,
    });
  };
  
  const badRequestResponse = (res, message) => {
    return res.status(400).json({
      code: 400,
      message,
    });
  };
  
  const unauthorizedResponse = (res, message) => {
    return res.status(401).json({
      code: 401,
      message,
    });
  };
  
  const forbiddenResponse = (res, message) => {
    return res.status(403).json({
      code: 403,
      message,
    });
  };
  
  const notFoundResponse = (res, message) => {
    return res.status(404).json({
      code: 404,
      message,
    });
  };
  
  const goneResponse = (res, message) => {
    return res.status(410).json({
      code: 410,
      message,
    });
  };
  
  const externalServiceResponse = (res, message) => {
    return res.status(502).json({
      code: 502,
      message,
    });
  };
  
  module.exports = {
    successResponse,
    serverErrorResponse,
    badRequestResponse,
    unauthorizedResponse,
    forbiddenResponse,
    notFoundResponse,
    goneResponse,
    externalServiceResponse,
  };