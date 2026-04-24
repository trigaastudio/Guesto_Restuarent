import authService from '../services/authService.js';

class AuthController {
  async register(req, res) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: authService.generateToken(user._id)
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await authService.login(email, password);
      
    
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: authService.generateToken(user._id)
        }
      });
    } catch (error) {
      const statusCode = error.statusCode || 401;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new AuthController();
