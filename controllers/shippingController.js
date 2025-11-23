// shippingController.js - FULL UPDATED CODE
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
    console.log('Creating shipping rule with data:', req.body);
    const rule = new ShippingRule(req.body);
    await rule.save();
    console.log('Shipping rule created successfully:', rule);
    res.status(201).json({ data: rule });
  } catch (error) {
    console.error('Error creating shipping rule:', error);
    res.status(400).json({ error: error.message });
  }
};

// Update shipping rule
export const updateShippingRule = async (req, res) => {
  try {
    console.log('Updating shipping rule:', req.params.id, req.body);
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

// Calculate shipping cost - SIMPLE VERSION
export const calculateShipping = async (req, res) => {
  try {
    const { subtotal, region = 'US', weight = 0 } = req.body;

    if (!subtotal || subtotal < 0) {
      return res.status(400).json({ error: "Valid subtotal is required" });
    }

    console.log(`Calculating shipping for subtotal: AED${subtotal}, region: ${region}`);

    // Find active rule for the specific region (NO AMOUNT RANGE CHECK)
    let shippingRule = await ShippingRule.findOne({
      isActive: true,
      region: region
    }).sort({ priority: 1 });

    // If no specific region rule, try GLOBAL rule
    if (!shippingRule) {
      shippingRule = await ShippingRule.findOne({
        isActive: true,
        region: 'GLOBAL'
      }).sort({ priority: 1 });
    }

    if (shippingRule) {
      console.log(`Using rule: ${shippingRule.name} for region: ${shippingRule.region}`);
      
      const isFreeShipping = subtotal >= shippingRule.freeShippingAt;
      const shippingCost = isFreeShipping ? 0 : shippingRule.shippingCost;

      const result = {
        shippingCost,
        isFreeShipping,
        deliveryDays: shippingRule.deliveryDays,
        rule: {
          name: shippingRule.name,
          region: shippingRule.region,
          freeShippingAt: shippingRule.freeShippingAt,
          shippingCost: shippingRule.shippingCost
        },
        remainingForFreeShipping: isFreeShipping ? 0 : Math.max(0, shippingRule.freeShippingAt - subtotal)
      };

      return res.json(result);
    }

    // Fallback to default values
    const result = {
      shippingCost: subtotal >= 100 ? 0 : 10,
      isFreeShipping: subtotal >= 100,
      deliveryDays: 3,
      rule: {
        name: "Default Shipping",
        region: region,
        freeShippingAt: 100,
        shippingCost: 10
      },
      remainingForFreeShipping: subtotal >= 100 ? 0 : Math.max(0, 100 - subtotal)
    };

    return res.json(result);
  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({ error: error.message });
  }
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