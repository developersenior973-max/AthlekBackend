import ShippingRule from "../models/ShippingRule.js";

// Get all shipping rules
export const getShippingRules = async (req, res) => {
  try {
    const rules = await ShippingRule.find().sort({ priority: 1, createdAt: -1 });
    res.json({ data: rules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get shipping rule by ID
export const getShippingRuleById = async (req, res) => {
  try {
    const rule = await ShippingRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: "Shipping rule not found" });
    }
    res.json({ data: rule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create shipping rule
export const createShippingRule = async (req, res) => {
  try {
    const rule = new ShippingRule(req.body);
    await rule.save();
    res.status(201).json({ data: rule });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update shipping rule
export const updateShippingRule = async (req, res) => {
  try {
    const rule = await ShippingRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!rule) {
      return res.status(404).json({ error: "Shipping rule not found" });
    }
    res.json({ data: rule });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete shipping rule
export const deleteShippingRule = async (req, res) => {
  try {
    const rule = await ShippingRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: "Shipping rule not found" });
    }
    res.json({ message: "Shipping rule deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Calculate shipping cost (public endpoint) - UPDATED
export const calculateShipping = async (req, res) => {
  try {
    const { subtotal, region = 'US', weight = 0 } = req.body;

    if (!subtotal || subtotal < 0) {
      return res.status(400).json({ error: "Valid subtotal is required" });
    }

    console.log(`Calculating shipping for subtotal: AED${subtotal}, region: ${region}, weight: ${weight}`);

    // Priority 1: Exact match for region and amount range
    const exactMatchRules = await ShippingRule.find({
      isActive: true,
      region: region,
      minOrderAmount: { $lte: subtotal },
      maxOrderAmount: { $gte: subtotal },
      minWeight: { $lte: weight },
      maxWeight: { $gte: weight }
    }).sort({ priority: 1 });

    console.log(`Found ${exactMatchRules.length} exact match rules for region: ${region}`);

    if (exactMatchRules.length > 0) {
      const selectedRule = exactMatchRules[0];
      return applyShippingRule(selectedRule, subtotal, res);
    }

    // Priority 2: GLOBAL rules that match amount range
    const globalMatchRules = await ShippingRule.find({
      isActive: true,
      region: 'GLOBAL',
      minOrderAmount: { $lte: subtotal },
      maxOrderAmount: { $gte: subtotal },
      minWeight: { $lte: weight },
      maxWeight: { $gte: weight }
    }).sort({ priority: 1 });

    console.log(`Found ${globalMatchRules.length} global match rules`);

    if (globalMatchRules.length > 0) {
      const selectedRule = globalMatchRules[0];
      return applyShippingRule(selectedRule, subtotal, res);
    }

    // Priority 3: Any active rule for the specific region (without amount range check)
    const anyRegionRule = await ShippingRule.findOne({
      isActive: true,
      region: region
    }).sort({ priority: 1 });

    if (anyRegionRule) {
      console.log(`Found region rule without amount match: ${anyRegionRule.name}`);
      return applyShippingRule(anyRegionRule, subtotal, res);
    }

    // Priority 4: Any active GLOBAL rule (without amount range check)
    const anyGlobalRule = await ShippingRule.findOne({
      isActive: true,
      region: 'GLOBAL'
    }).sort({ priority: 1 });

    if (anyGlobalRule) {
      console.log(`Found global rule without amount match: ${anyGlobalRule.name}`);
      return applyShippingRule(anyGlobalRule, subtotal, res);
    }

    // Fallback to default values
    console.log(`No active rules found, using default values`);
    const defaultResult = {
      shippingCost: subtotal >= 100 ? 0 : 10,
      isFreeShipping: subtotal >= 100,
      deliveryDays: 3,
      rule: {
        name: "Default Shipping",
        region: region,
        freeShippingAt: 100,
        minOrderAmount: 0,
        maxOrderAmount: 10000
      },
      remainingForFreeShipping: subtotal >= 100 ? 0 : Math.max(0, 100 - subtotal)
    };

    console.log(`Default shipping calculation result:`, defaultResult);
    return res.json(defaultResult);

  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to apply shipping rule
const applyShippingRule = (rule, subtotal, res) => {
  console.log(`Selected rule: ${rule.name}`);
  console.log(`Rule details: region=${rule.region}, minOrder=${rule.minOrderAmount}, maxOrder=${rule.maxOrderAmount}, shippingCost=${rule.shippingCost}, freeShippingAt=${rule.freeShippingAt}`);
  
  const isFreeShipping = subtotal >= rule.freeShippingAt;
  const shippingCost = isFreeShipping ? 0 : rule.shippingCost;

  const result = {
    shippingCost,
    isFreeShipping,
    deliveryDays: rule.deliveryDays,
    rule: {
      name: rule.name,
      region: rule.region,
      freeShippingAt: rule.freeShippingAt,
      minOrderAmount: rule.minOrderAmount,
      maxOrderAmount: rule.maxOrderAmount
    },
    remainingForFreeShipping: isFreeShipping ? 0 : Math.max(0, rule.freeShippingAt - subtotal)
  };

  console.log(`Shipping calculation result:`, result);
  return res.json(result);
};

// Get active shipping rules (public endpoint)
export const getActiveShippingRules = async (req, res) => {
  try {
    const rules = await ShippingRule.find({ isActive: true }).sort({ priority: 1 });
    res.json({ data: rules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};