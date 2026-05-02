import dashboardService from '../services/dashboardService.js';

class DashboardController {
  async getStats(req, res) {
    try {
      const stats = await dashboardService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new DashboardController();
