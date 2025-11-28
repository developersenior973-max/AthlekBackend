import mongoose from "mongoose";
import Bundle from "../models/Bundle.js";

const buildFullImageUrl = (baseUrl, path) => {
  if (!path) {
    return null;
  }
  if (path.startsWith("http")) {
    return path;
  }
  if (path.startsWith("/")) {
    return `${baseUrl}${path}`;
  }
  return `${baseUrl}/${path}`;
};

const enhanceBundleWithImages = (bundle, baseUrl) => {
  const bundleObj = bundle.toObject();
  bundleObj.products = bundleObj.products.map(product => ({
    ...product,
    images: product.images ? product.images.map(img => buildFullImageUrl(baseUrl, img)) : []
  }));
  bundleObj.heroImage = buildFullImageUrl(baseUrl, bundleObj.heroImage);
  bundleObj.galleryImages = Array.isArray(bundleObj.galleryImages)
    ? bundleObj.galleryImages.map(img => buildFullImageUrl(baseUrl, img))
    : [];
  bundleObj.colorOptions = Array.isArray(bundleObj.colorOptions)
    ? bundleObj.colorOptions.map(option => ({
        ...option,
        thumbnailImage: buildFullImageUrl(baseUrl, option.thumbnailImage),
        galleryImages: Array.isArray(option.galleryImages)
          ? option.galleryImages.map(img => buildFullImageUrl(baseUrl, img))
          : [],
      }))
    : [];
  bundleObj.packOptions = Array.isArray(bundleObj.packOptions)
    ? bundleObj.packOptions.map(option => ({
        ...option,
        thumbnailImage: buildFullImageUrl(baseUrl, option.thumbnailImage),
      }))
    : [];
  return bundleObj;
};

const parseJsonField = (value) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value ? [value] : [];
    }
  }
  return value;
};

const normalizeImageArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(Boolean)
    .map((img) => (typeof img === "string" ? img.trim() : img))
    .filter(Boolean);
};

// Get all bundles
export const getBundles = async (req, res) => {
  try {
    const bundles = await Bundle.find().populate("products");
    // Force HTTPS to prevent mixed content warnings, especially when behind a proxy.
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const bundlesWithFullUrls = bundles.map(bundle => enhanceBundleWithImages(bundle, baseUrl));
    res.json({ data: bundlesWithFullUrls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get bundle by ID
export const getBundleById = async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id).populate("products");
    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" });
    }
    // Force HTTPS to prevent mixed content warnings
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    res.json({ data: enhanceBundleWithImages(bundle, baseUrl) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new bundle
export const createBundle = async (req, res) => {
  try {
    const bundleData = { ...req.body };

    bundleData.galleryImages = normalizeImageArray(parseJsonField(bundleData.galleryImages));
    const parsedColorOptions = parseJsonField(bundleData.colorOptions);
    const parsedPackOptions = parseJsonField(bundleData.packOptions);
    const parsedSizeOptions = parseJsonField(bundleData.sizeOptions);
    const parsedGuarantees = parseJsonField(bundleData.guarantees);
    const parsedLengthOptions = parseJsonField(bundleData.lengthOptions);
    const parsedVariations = parseJsonField(bundleData.variations);

    bundleData.colorOptions = Array.isArray(parsedColorOptions) ? parsedColorOptions : [];
    bundleData.packOptions = Array.isArray(parsedPackOptions) ? parsedPackOptions : [];
    bundleData.sizeOptions = Array.isArray(parsedSizeOptions) ? parsedSizeOptions.filter(Boolean) : [];
    bundleData.guarantees = Array.isArray(parsedGuarantees) ? parsedGuarantees : [];
    bundleData.lengthOptions = Array.isArray(parsedLengthOptions) ? parsedLengthOptions.filter(Boolean) : [];

    bundleData.variations = Array.isArray(parsedVariations) ? parsedVariations : [];
    if (typeof bundleData.sizePriceVariation === "string") {
      try {
        bundleData.sizePriceVariation = JSON.parse(bundleData.sizePriceVariation);
      } catch (error) {
        bundleData.sizePriceVariation = {};
      }
    }

    if (typeof bundleData.products === "string") {
      try {
        bundleData.products = JSON.parse(bundleData.products);
      } catch {
        bundleData.products = bundleData.products ? [bundleData.products] : [];
      }
    }

    if (!Array.isArray(bundleData.products)) {
      bundleData.products = [];
    }

    if (!bundleData.heroImage || bundleData.heroImage === "null" || bundleData.heroImage === "undefined") {
      bundleData.heroImage = undefined;
    }

    // Ensure at least one pack option exists
    if (!Array.isArray(bundleData.packOptions) || bundleData.packOptions.length === 0) {
      const fallbackQuantity = bundleData.products?.length || 1;
      bundleData.packOptions = [
        {
          name: `${fallbackQuantity}-Pack`,
          quantity: fallbackQuantity,
          totalPrice: Number(bundleData.bundlePrice) || 0,
          pricePerItem:
            fallbackQuantity > 0
              ? Number(((Number(bundleData.bundlePrice) || 0) / fallbackQuantity).toFixed(2))
              : 0,
        },
      ];
    }

    bundleData.packOptions = bundleData.packOptions.map((option) => {
      const quantity = Number(option.quantity) || 0;
      const totalPrice = Number(option.totalPrice) || 0;
      const pricePerItem =
        option.pricePerItem !== undefined
          ? Number(option.pricePerItem)
          : quantity > 0
            ? Number((totalPrice / quantity).toFixed(2))
            : 0;
      return {
        ...option,
        quantity,
        totalPrice,
        pricePerItem,
      };
    });

    // Add bundle type based on product count (fallback to pack count)
    if (bundleData.products.length > 0) {
    bundleData.bundleType = `${bundleData.products.length}-products`;
    } else {
      bundleData.bundleType = `${bundleData.packOptions.length}-packs`;
    }

    const bundle = new Bundle(bundleData);
    await bundle.save();

    const populatedBundle = await Bundle.findById(bundle._id).populate("products");
    // Force HTTPS to prevent mixed content warnings
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    res.status(201).json({ data: enhanceBundleWithImages(populatedBundle, baseUrl) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update bundle
export const updateBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    updateData.galleryImages = normalizeImageArray(parseJsonField(updateData.galleryImages));

    const parsedColorOptions = parseJsonField(updateData.colorOptions);
    if (parsedColorOptions) {
      updateData.colorOptions = parsedColorOptions;
    }

    const parsedPackOptions = parseJsonField(updateData.packOptions);
    if (parsedPackOptions) {
      updateData.packOptions = parsedPackOptions.map((option) => {
        const quantity = Number(option.quantity) || 0;
        const totalPrice = Number(option.totalPrice) || 0;
        const pricePerItem =
          option.pricePerItem !== undefined
            ? Number(option.pricePerItem)
            : quantity > 0
              ? Number((totalPrice / quantity).toFixed(2))
              : 0;
        return {
          ...option,
          quantity,
          totalPrice,
          pricePerItem,
        };
      });
    }

    if (!updateData.packOptions || updateData.packOptions.length === 0) {
      const fallbackQuantity = updateData.products?.length || 1;
      updateData.packOptions = [
        {
          name: `${fallbackQuantity}-Pack`,
          quantity: fallbackQuantity,
          totalPrice: Number(updateData.bundlePrice) || 0,
          pricePerItem:
            fallbackQuantity > 0
              ? Number(((Number(updateData.bundlePrice) || 0) / fallbackQuantity).toFixed(2))
              : 0,
        },
      ];
    }

    const parsedSizeOptions = parseJsonField(updateData.sizeOptions);
    if (parsedSizeOptions) {
      updateData.sizeOptions = parsedSizeOptions;
    }

    const parsedGuarantees = parseJsonField(updateData.guarantees);
    if (parsedGuarantees) {
      updateData.guarantees = parsedGuarantees;
    }

    const parsedLengthOptions = parseJsonField(updateData.lengthOptions);
    if (parsedLengthOptions) {
      updateData.lengthOptions = parsedLengthOptions;
    }

    const parsedVariations = parseJsonField(updateData.variations);
    if (parsedVariations) {
      updateData.variations = parsedVariations;
    }

    if (typeof updateData.sizePriceVariation === "string") {
      try {
        updateData.sizePriceVariation = JSON.parse(updateData.sizePriceVariation);
      } catch (error) {
        updateData.sizePriceVariation = {};
      }
    }

    if (typeof updateData.products === "string") {
      try {
        updateData.products = JSON.parse(updateData.products);
      } catch {
        updateData.products = updateData.products ? [updateData.products] : [];
      }
    }

    if (!Array.isArray(updateData.products)) {
      updateData.products = [];
    }

    if (updateData.heroImage === "" || updateData.heroImage === null || updateData.heroImage === "null" || updateData.heroImage === "undefined") {
      updateData.heroImage = undefined;
    }

    // Add bundle type based on new data
    if (updateData.products?.length) {
      updateData.bundleType = `${updateData.products.length}-products`;
    } else if (updateData.packOptions?.length) {
      updateData.bundleType = `${updateData.packOptions.length}-packs`;
    }

    const bundle = await Bundle.findByIdAndUpdate(id, updateData, { new: true }).populate("products");

    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    // Force HTTPS to prevent mixed content warnings
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    res.json({ data: enhanceBundleWithImages(bundle, baseUrl) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete bundle
export const deleteBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const bundle = await Bundle.findByIdAndDelete(id);

    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    res.json({ message: "Bundle deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get active bundles (for public website)
export const getActiveBundles = async (req, res) => {
  try {
    const now = new Date();
    console.log('🔍 Fetching active bundles at:', now.toISOString());
    
    // First, let's get all bundles to debug
    const allBundles = await Bundle.find({ isActive: true }).populate("products");
    console.log('📦 All active bundles found:', allBundles.length);
    allBundles.forEach(bundle => {
      console.log(`Bundle: ${bundle.name}, Start: ${bundle.startDate}, End: ${bundle.endDate}, Category: ${bundle.category}`);
      if (bundle.startDate) {
        console.log(`  Start date comparison: ${bundle.startDate} <= ${now} = ${bundle.startDate <= now}`);
      }
      if (bundle.endDate) {
        console.log(`  End date comparison: ${bundle.endDate} >= ${now} = ${bundle.endDate >= now}`);
      }
    });
    
    // Temporarily disable date filtering to debug
    const bundles = await Bundle.find({
      isActive: true
    }).populate("products");
    
    console.log('📦 Found bundles:', bundles.length);
    bundles.forEach(bundle => {
      console.log(`Bundle: ${bundle.name}, Start: ${bundle.startDate}, End: ${bundle.endDate}, Category: ${bundle.category}`);
    });    // Force HTTPS to prevent mixed content warnings
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const bundlesWithFullUrls = bundles.map(bundle => enhanceBundleWithImages(bundle, baseUrl));
    res.json({ data: bundlesWithFullUrls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get active bundles by category (for public website)
export const getActiveBundlesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!['men', 'women', 'mixed'].includes(category)) {
      return res.status(400).json({ error: "Category must be 'men', 'women', or 'mixed'" });
    }

    // Temporarily disable date filtering to debug
    // For mixed category, get bundles that have mixed category or no category
    const categoryFilter = category === 'mixed' 
      ? { $or: [{ category: 'mixed' }, { category: { $exists: false } }] }
      : { category: category };
      
    const bundles = await Bundle.find({
      isActive: true,
      ...categoryFilter
    }).populate("products");
    // Force HTTPS to prevent mixed content warnings
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const bundlesWithFullUrls = bundles.map(bundle => enhanceBundleWithImages(bundle, baseUrl));
    res.json({ data: bundlesWithFullUrls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPublicBundleDetail = async (req, res) => {
  try {
    const { id } = req.params;
    let bundle = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      bundle = await Bundle.findById(id).populate("products");
    }

    if (!bundle) {
      bundle = await Bundle.findOne({ name: id }).populate("products");
    }

    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    // Force HTTPS to prevent mixed content warnings
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    res.json({ data: enhanceBundleWithImages(bundle, baseUrl) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Calculate bundle discount for cart items
export const calculateBundleDiscount = async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({ error: "Cart items are required" });
    }

    // Get all active bundles
    const now = new Date();
    const bundles = await Bundle.find({
      isActive: true,
      $and: [
        {
      $or: [
        { startDate: { $exists: false } },
        { startDate: { $lte: now } }
          ]
        },
        {
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: now } }
          ]
        }
      ]
    }).populate("products");
    // Force HTTPS to prevent mixed content warnings
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const bundlesWithFullUrls = bundles.map(bundle => enhanceBundleWithImages(bundle, baseUrl));

    let bestDiscount = null;
    let appliedBundle = null;

    // Check each bundle
    for (const bundle of bundlesWithFullUrls) {
      const bundleProductIds = bundle.products.map(p => p._id.toString());
      const cartProductIds = cartItems.map(item => item.productId);

      // Check if all bundle products are in cart
      const hasAllBundleProducts = bundleProductIds.every(id =>
        cartProductIds.includes(id)
      );

      if (hasAllBundleProducts) {
        // Calculate potential savings
        const bundleTotal = bundle.bundlePrice;
        const individualTotal = cartItems
          .filter(item => bundleProductIds.includes(item.productId))
          .reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const savings = individualTotal - bundleTotal;

        if (savings > 0 && (!bestDiscount || savings > bestDiscount)) {
          bestDiscount = savings;
          appliedBundle = bundle;
        }
      }
    }

    res.json({
      hasBundleDiscount: !!appliedBundle,
      bundle: appliedBundle,
      discountAmount: bestDiscount || 0,
      discountPercentage: appliedBundle ?
        Math.round(((bestDiscount / appliedBundle.originalPrice) * 100)) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
