import Settings from "../models/Settings.js";

// Get settings
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create default settings with USD currency
      settings = new Settings({ currency: "USD" });
      await settings.save();
    }
    // Return all settings including homepage images
    res.json({
      currency: settings.currency,
      homepageImage1: settings.homepageImage1 || '',
      homepageImage1Type: settings.homepageImage1Type || 'image',
      homepageImage2: settings.homepageImage2 || '',
      homepageImage3: settings.homepageImage3 || '',
      homepageImage4: settings.homepageImage4 || '',
      homepageImage5: settings.homepageImage5 || '',
      homepageImage6: settings.homepageImage6 || '',
      homepageImage7: settings.homepageImage7 || ''
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};

// Update settings
export const updateSettings = async (req, res) => {
  try {
    const settingsData = JSON.parse(req.body.settingsData || "{}");
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(settingsData);
    } else {
      // Update all fields that are provided
      if (settingsData.currency !== undefined) {
        settings.currency = settingsData.currency;
      }
      if (settingsData.homepageImage1 !== undefined) {
        settings.homepageImage1 = settingsData.homepageImage1;
      }
      if (settingsData.homepageImage1Type !== undefined) {
        settings.homepageImage1Type = settingsData.homepageImage1Type;
      }
      if (settingsData.homepageImage2 !== undefined) {
        settings.homepageImage2 = settingsData.homepageImage2;
      }
      if (settingsData.homepageImage3 !== undefined) {
        settings.homepageImage3 = settingsData.homepageImage3;
      }
      if (settingsData.homepageImage4 !== undefined) {
        settings.homepageImage4 = settingsData.homepageImage4;
      }
      if (settingsData.homepageImage5 !== undefined) {
        settings.homepageImage5 = settingsData.homepageImage5;
      }
      if (settingsData.homepageImage6 !== undefined) {
        settings.homepageImage6 = settingsData.homepageImage6;
      }
      if (settingsData.homepageImage7 !== undefined) {
        settings.homepageImage7 = settingsData.homepageImage7;
      }
    }

    await settings.save();
    // Return all settings including homepage images
    res.json({
      currency: settings.currency,
      homepageImage1: settings.homepageImage1 || '',
      homepageImage1Type: settings.homepageImage1Type || 'image',
      homepageImage2: settings.homepageImage2 || '',
      homepageImage3: settings.homepageImage3 || '',
      homepageImage4: settings.homepageImage4 || '',
      homepageImage5: settings.homepageImage5 || '',
      homepageImage6: settings.homepageImage6 || '',
      homepageImage7: settings.homepageImage7 || ''
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
}; 