import Settings from "../models/Settings.js";

const imageFields = [
  "homepageImage1",
  "homepageImage2",
  "homepageImage3",
  "homepageImage4",
  "homepageImage5",
  "homepageImage6",
  "homepageImage7",
  "salesImage1",
  "salesImage2",
  "discoverYourFitMen",
  "discoverYourFitWomen",
  "discoverYourFitNewArrivals",
  "discoverYourFitSets",
  "categoriesMenBackground",
  "categoriesMenForeground",
  "categoriesWomenBackground",
  "categoriesWomenForeground",
  "communityHighlight1",
  "communityHighlight2",
  "communityHighlight3",
  "communityHighlight4",
  "communityHighlight5",
  "communityHighlight6",
  "communityHighlight7",
  "communityHighlight8",
  "communityHighlight9",
];

const setFieldsIfProvided = (target, source, fields) => {
  fields.forEach((field) => {
    if (source[field] !== undefined) {
      target[field] = source[field];
    }
  });
};

const formatSettingsResponse = (settings, formatUrl) => {
  const response = {
    currency: settings.currency,
    homepageImage1Type: settings.homepageImage1Type || "image",
  };

  imageFields.forEach((field) => {
    response[field] = formatUrl(settings[field]);
  });

  return response;
};

// Get settings
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ currency: "USD" });
      await settings.save();
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const formatUrl = (value) => {
      if (!value) return "";
      if (value.startsWith("http")) return value;
      return `${baseUrl}${value.startsWith("/") ? value : `/${value}`}`;
    };

    res.json(formatSettingsResponse(settings, formatUrl));
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
      if (settingsData.currency !== undefined) {
        settings.currency = settingsData.currency;
      }
      if (settingsData.homepageImage1Type !== undefined) {
        settings.homepageImage1Type = settingsData.homepageImage1Type;
      }
      setFieldsIfProvided(settings, settingsData, imageFields);
    }

    await settings.save();

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const formatUrl = (value) => {
      if (!value) return "";
      if (value.startsWith("http")) return value;
      return `${baseUrl}${value.startsWith("/") ? value : `/${value}`}`;
    };

    res.json(formatSettingsResponse(settings, formatUrl));
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
}; 