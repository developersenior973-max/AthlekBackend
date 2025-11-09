import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  currency: { 
    type: String, 
    default: "USD" 
  },
  homepageImage1: {
    type: String,
    default: ""
  },
  homepageImage1Type: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  homepageImage2: {
    type: String,
    default: ""
  },
  homepageImage3: {
    type: String,
    default: ""
  },
  homepageImage4: {
    type: String,
    default: ""
  },
  homepageImage5: {
    type: String,
    default: ""
  },
  homepageImage6: {
    type: String,
    default: ""
  },
  homepageImage7: {
    type: String,
    default: ""
  },
  salesImage1: {
    type: String,
    default: ""
  },
  salesImage2: {
    type: String,
    default: ""
  },
  discoverYourFitMen: {
    type: String,
    default: ""
  },
  discoverYourFitWomen: {
    type: String,
    default: ""
  },
  discoverYourFitNewArrivals: {
    type: String,
    default: ""
  },
  discoverYourFitSets: {
    type: String,
    default: ""
  },
  categoriesMenBackground: {
    type: String,
    default: ""
  },
  categoriesMenForeground: {
    type: String,
    default: ""
  },
  categoriesWomenBackground: {
    type: String,
    default: ""
  },
  categoriesWomenForeground: {
    type: String,
    default: ""
  },
  communityHighlight1: { type: String, default: "" },
  communityHighlight2: { type: String, default: "" },
  communityHighlight3: { type: String, default: "" },
  communityHighlight4: { type: String, default: "" },
  communityHighlight5: { type: String, default: "" },
  communityHighlight6: { type: String, default: "" },
  communityHighlight7: { type: String, default: "" },
  communityHighlight8: { type: String, default: "" },
  communityHighlight9: { type: String, default: "" }
}, {
  timestamps: true
});

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings; 