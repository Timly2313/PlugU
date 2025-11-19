import { supabase } from '../lib/supabase';

/* Fetch all crops for the current user*/
export const fetchUserCrops = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_crops')
      .select('*')
      .eq('user_id', userId) 
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user crops:', error);
    return { data: null, error };
  }
};

export const countUserCrops = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('user_crops')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error counting user crops:', error);
    return 0;
  }
};

export const countCropsByHealthStatus = async (userId, healthStatus) => {
  try {
    const { count, error } = await supabase
      .from('user_crops')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', healthStatus);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error counting crops by health status:', error);
    return 0;
  }
};

export const fetchCropById = async (cropId) => {
  try {
    const { data, error } = await supabase
      .from('user_crops')
      .select('*')
      .eq('user_crop_id', cropId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching crop:', error);
    return { data: null, error };
  }
};

/**
 * Insert a new crop
 */
export const insertCrop = async (cropData) => {
  try {
    // Validate that user_id is present
    if (!cropData.user_id) {
      throw new Error('User ID is required to create a crop');
    }

    const { data, error } = await supabase
      .from('user_crops')
      .insert([cropData])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting crop:', error);
    return { data: null, error };
  }
};

/**
 * Update an existing crop
 */
export const updateCrop = async (cropId, updates) => {
  try {
    const { data, error } = await supabase
      .from('user_crops')
      .update(updates)
      .eq('user_crop_id', cropId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating crop:', error);
    return { data: null, error };
  }
};

/**
 * Delete a crop
 */
export const deleteCrop = async (cropId) => {
  try {
    const { error } = await supabase
      .from('user_crops')
      .delete()
      .eq('user_crop_id', cropId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting crop:', error);
    return { error };
  }
};

/**
 * Update crop status
 */
export const updateCropStatus = async (cropId, status) => {
  try {
    const { data, error } = await supabase
      .from('user_crops')
      .update({ status })
      .eq('user_crop_id', cropId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating crop status:', error);
    return { data: null, error };
  }
};

/**
 * Update crop growth percentage
 */
export const updateCropGrowth = async (cropId, growthPercentage) => {
  try {
    const { data, error } = await supabase
      .from('user_crops')
      .update({ growth_percentage: growthPercentage })
      .eq('user_crop_id', cropId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating crop growth:', error);
    return { data: null, error };
  }
};

/**
 * Update days to harvest
 */
export const updateDaysToHarvest = async (cropId, daysToHarvest) => {
  try {
    const { data, error } = await supabase
      .from('user_crops')
      .update({ days_to_harvest: daysToHarvest })
      .eq('user_crop_id', cropId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating days to harvest:', error);
    return { data: null, error };
  }
};

// ==================== LOG FUNCTIONS ====================

/**
 * Fetch all logs for a specific crop
 */
export const fetchCropLogs = async (cropId) => {
  try {
    const { data, error } = await supabase
      .from('crop_logs')
      .select('*')
      .eq('user_crop_id', cropId)
      .order('log_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching crop logs:', error);
    return { data: null, error };
  }
};

/**
 * Fetch all logs for the current user (across all crops)
 */
export const fetchAllUserLogs = async () => {
  try {
    const { data, error } = await supabase
      .from('crop_logs')
      .select(`
        *,
        user_crops (
          crop_name,
          variety,
          location
        )
      `)
      .order('log_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching all logs:', error);
    return { data: null, error };
  }
};

/**
 * Fetch a single log by ID
 */
export const fetchLogById = async (logId) => {
  try {
    const { data, error } = await supabase
      .from('crop_logs')
      .select(`
        *,
        user_crops (
          crop_name,
          variety,
          location
        )
      `)
      .eq('log_id', logId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching log:', error);
    return { data: null, error };
  }
};

/**
 * Insert a new log entry
 */
export const insertLog = async (logData) => {
  try {
    const { data, error } = await supabase
      .from('crop_logs')
      .insert([logData])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting log:', error);
    return { data: null, error };
  }
};

/**
 * Update an existing log entry
 */
export const updateLog = async (logId, updates) => {
  try {
    const { data, error } = await supabase
      .from('crop_logs')
      .update(updates)
      .eq('log_id', logId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating log:', error);
    return { data: null, error };
  }
};

/**
 * Delete a log entry
 */
export const deleteLog = async (logId) => {
  try {
    const { error } = await supabase
      .from('crop_logs')
      .delete()
      .eq('log_id', logId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting log:', error);
    return { error };
  }
};

/**
 * Fetch logs by activity type
 */
export const fetchLogsByActivityType = async (cropId, activityType) => {
  try {
    const { data, error } = await supabase
      .from('crop_logs')
      .select('*')
      .eq('user_crop_id', cropId)
      .eq('activity_type', activityType)
      .order('log_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching logs by activity type:', error);
    return { data: null, error };
  }
};

/**
 * Fetch logs within a date range
 */
export const fetchLogsByDateRange = async (cropId, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('crop_logs')
      .select('*')
      .eq('user_crop_id', cropId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching logs by date range:', error);
    return { data: null, error };
  }
};

// ==================== BATCH OPERATIONS ====================

/**
 * Insert multiple logs at once
 */
export const insertMultipleLogs = async (logsData) => {
  try {
    const { data, error } = await supabase
      .from('crop_logs')
      .insert(logsData)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting multiple logs:', error);
    return { data: null, error };
  }
};

/**
 * Update multiple crops at once
 */
export const updateMultipleCrops = async (updates) => {
  try {
    const { data, error } = await supabase
      .from('user_crops')
      .upsert(updates)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating multiple crops:', error);
    return { data: null, error };
  }
};

// ==================== STATISTICS FUNCTIONS ====================

/**
 * Get crop statistics
 */
export const getCropStatistics = async () => {
  try {
    const { data: crops, error } = await supabase
      .from('user_crops')
      .select('status, growth_percentage, days_to_harvest');

    if (error) throw error;

    const stats = {
      totalCrops: crops.length,
      byStatus: {},
      averageGrowth: 0,
      readyToHarvest: 0,
      needsAttention: 0
    };

    let totalGrowth = 0;

    crops.forEach(crop => {
      // Count by status
      stats.byStatus[crop.status] = (stats.byStatus[crop.status] || 0) + 1;
      
      // Sum growth for average
      totalGrowth += crop.growth_percentage || 0;
      
      // Count ready to harvest (days_to_harvest <= 7)
      if (crop.days_to_harvest && crop.days_to_harvest <= 7) {
        stats.readyToHarvest++;
      }
      
      // Count needs attention (growth < 30% or status = 'warning')
      if (crop.growth_percentage < 30 || crop.status === 'warning') {
        stats.needsAttention++;
      }
    });

    stats.averageGrowth = crops.length > 0 ? Math.round(totalGrowth / crops.length) : 0;

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting crop statistics:', error);
    return { data: null, error };
  }
};

/**
 * Get log statistics for a crop
 */
export const getLogStatistics = async (cropId) => {
  try {
    const { data: logs, error } = await supabase
      .from('crop_logs')
      .select('activity_type, log_date')
      .eq('user_crop_id', cropId);

    if (error) throw error;

    const stats = {
      totalLogs: logs.length,
      byActivityType: {},
      recentActivity: 0
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    logs.forEach(log => {
      // Count by activity type
      stats.byActivityType[log.activity_type] = (stats.byActivityType[log.activity_type] || 0) + 1;
      
      // Count recent activity (last 30 days)
      if (new Date(log.log_date) >= thirtyDaysAgo) {
        stats.recentActivity++;
      }
    });

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting log statistics:', error);
    return { data: null, error };
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate days to harvest based on planted date and expected harvest date
 */
export const calculateDaysToHarvest = (plantedDate, expectedHarvestDate) => {
  const planted = new Date(plantedDate);
  const harvest = new Date(expectedHarvestDate);
  const today = new Date();
  
  const timeDiff = harvest.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * Calculate growth percentage
 */
export const calculateGrowthPercentage = (plantedDate, expectedHarvestDate, currentGrowth = null) => {
  if (currentGrowth !== null) return currentGrowth;
  
  const planted = new Date(plantedDate);
  const harvest = new Date(expectedHarvestDate);
  const today = new Date();
  
  const totalDays = Math.ceil((harvest - planted) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((today - planted) / (1000 * 60 * 60 * 24));
  
  return Math.min(Math.round((daysPassed / totalDays) * 100), 95);
};

/**
 * Validate crop data before insertion/update
 */
export const validateCropData = (cropData) => {
  const errors = [];

  if (!cropData.crop_name?.trim()) {
    errors.push('Crop name is required');
  }

  if (!cropData.variety?.trim()) {
    errors.push('Variety is required');
  }

  if (!cropData.location?.trim()) {
    errors.push('Location is required');
  }

  if (!cropData.planted_date) {
    errors.push('Planted date is required');
  }

  if (!cropData.expected_harvest_date) {
    errors.push('Expected harvest date is required');
  }

  if (cropData.planted_date && cropData.expected_harvest_date) {
    const planted = new Date(cropData.planted_date);
    const harvest = new Date(cropData.expected_harvest_date);
    
    if (harvest <= planted) {
      errors.push('Expected harvest date must be after planted date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate log data before insertion/update
 */
export const validateLogData = (logData) => {
  const errors = [];

  if (!logData.user_crop_id) {
    errors.push('Crop ID is required');
  }

  if (!logData.activity_type?.trim()) {
    errors.push('Activity type is required');
  }

  if (!logData.description?.trim()) {
    errors.push('Description is required');
  }

  if (!logData.plant_condition?.trim()) {
    errors.push('Plant condition is required');
  }

  if (!logData.log_date) {
    errors.push('Log date is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  // Crop functions
  fetchUserCrops,
  fetchCropById,
  insertCrop,
  updateCrop,
  deleteCrop,
  updateCropStatus,
  updateCropGrowth,
  updateDaysToHarvest,
  
  // Log functions
  fetchCropLogs,
  fetchAllUserLogs,
  fetchLogById,
  insertLog,
  updateLog,
  deleteLog,
  fetchLogsByActivityType,
  fetchLogsByDateRange,
  
  // Batch operations
  insertMultipleLogs,
  updateMultipleCrops,
  
  // Statistics
  getCropStatistics,
  getLogStatistics,
  
  // Helper functions
  calculateDaysToHarvest,
  calculateGrowthPercentage,
  validateCropData,
  validateLogData
};