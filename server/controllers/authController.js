const { User, UserSettings } = require('../models');
const { hashPassword, comparePassword } = require('../helpers/bcrypt');
const { generateToken } = require('../helpers/jwt');

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, telegramChatId } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ 
          success: false,
          message: 'Email dan password wajib diisi' 
        });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: 'Email sudah terdaftar' 
        });
      }

      // Hash password
      const hashedPassword = hashPassword(password);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        telegramChatId: telegramChatId || null
      });

      // Create default settings (inactive - user must setup first)
      await UserSettings.create({
        userId: user.id,
        locationId: '200',
        locationName: 'Butik Emas LM - Pulo Gadung (Kantor Pusat)',
        targetWeights: [],
        isActive: false  // User must activate manually
      });

      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil',
        data: {
          id: user.id,
          email: user.email
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ 
          success: false,
          message: 'Email dan password wajib diisi' 
        });
      }

      // Find user
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'Email atau password salah' 
        });
      }

      // Verify password
      const isValid = comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ 
          success: false,
          message: 'Email atau password salah' 
        });
      }

      // Generate JWT token
      const token = generateToken({ id: user.id, email: user.email });

      res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          access_token: token,
          user: {
            id: user.id,
            email: user.email
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'email', 'telegramChatId', 'createdAt'],
        include: [{
          model: UserSettings,
          as: 'settings'
        }]
      });

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
