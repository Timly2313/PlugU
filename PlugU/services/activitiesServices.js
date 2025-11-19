import { supabase } from '../lib/supabase';


const ACTIVITY_TYPES = {
  watering: 'watering',
  planting: 'planting',
  harvesting: 'harvesting',
  pruning: 'pruning',
  pest_control: 'pest_control',
  fertilizing: 'fertilizing',
  weeding: 'weeding'
};

export const activitiesService = {
    
 async fetchUserActivities(userId) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform database data to match your component structure
      const transformedData = data.map(activity => ({
        id: activity.id,
        type: activity.category,
        crop: activity.title, // Using title as crop name
        description: activity.description,
        date: activity.due_date,
        duration: 30, // Default duration or you can add this column
        notes: activity.notes,
        status: activity.is_completed ? 'done' : 'not_done'
      }));

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Error fetching activities:', error);
      return { data: null, error };
    }
  },
  
  
 async fetchUserActivitiesSummary(userId) {
  try {
    // Validate userId
    if (!userId) {
      throw new Error('User ID is required');
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString()) 
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Handle case where no activities found
    if (!data || data.length === 0) {
      return {
        data: {
          done: [],
          not_done: []
        },
        summary: {
          totalDoneDuration: 0,       
          totalPendingDuration: 0,   
          totalDuration: 0
        },
        error: null
      };
    }

    // Transform and separate into done/not_done
    const transformedData = data.map(activity => ({
      id: activity.id,
      type: activity.category,
      crop: activity.title,
      description: activity.description,
      date: activity.due_date,
      duration: activity.duration || 30, // Default to 30 minutes if not provided
      notes: activity.notes,
      status: activity.is_completed ? 'done' : 'not_done'
    }));

    // Separate activities by status
    const doneActivities = transformedData.filter(a => a.status === 'done');
    const notDoneActivities = transformedData.filter(a => a.status === 'not_done');

    // Calculate total durations
    const totalDoneDuration = doneActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const totalPendingDuration = notDoneActivities.reduce((sum, a) => sum + (a.duration || 0), 0);

    return {
      data: {
        done: doneActivities,
        not_done: notDoneActivities
      },
      summary: {
        totalDoneDuration,       
        totalPendingDuration,   
        totalDuration: totalDoneDuration + totalPendingDuration
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching user activities summary:', error);
    return { 
      data: {
        done: [],
        not_done: []
      },
      summary: {
        totalDoneDuration: 0,       
        totalPendingDuration: 0,   
        totalDuration: 0
      }, 
      error 
    };
  }
},


  
  // Add new activity
  async addActivity(activityData) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([
          {
            user_id: activityData.userId,
            title: activityData.crop,
            description: activityData.description,
            category: activityData.type,
            due_date: activityData.date,
            notes: activityData.notes,
            is_completed: false
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Transform the response to match your component structure
      const transformedActivity = {
        id: data.id,
        type: data.category,
        crop: data.title,
        description: data.description,
        date: data.due_date,
        duration: activityData.duration || 30,
        notes: data.notes,
        status: data.is_completed ? 'done' : 'not_done'
      };

      return { data: transformedActivity, error: null };
    } catch (error) {
      console.error('Error adding activity:', error);
      return { data: null, error };
    }
  },

  // Update activity
  async updateActivity(activityId, updates) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .update({
          title: updates.crop,
          description: updates.description,
          category: updates.type,
          due_date: updates.date,
          notes: updates.notes,
          is_completed: updates.status === 'done'
        })
        .eq('id', activityId)
        .select()
        .single();

      if (error) throw error;

      const transformedActivity = {
        id: data.id,
        type: data.category,
        crop: data.title,
        description: data.description,
        date: data.due_date,
        duration: updates.duration || 30,
        notes: data.notes,
        status: data.is_completed ? 'done' : 'not_done'
      };

      return { data: transformedActivity, error: null };
    } catch (error) {
      console.error('Error updating activity:', error);
      return { data: null, error };
    }
  },

  // Update activity status only
  async updateActivityStatus(activityId, status) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .update({
          is_completed: status === 'done'
        })
        .eq('id', activityId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating activity status:', error);
      return { data: null, error };
    }
  },

  // Delete activity
  async deleteActivity(activityId) {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting activity:', error);
      return { error };
    }
  },

  // Count activities by status
  async countUserActivities(userId) {
    try {
      const { count, error } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (error) {
      console.error('Error counting activities:', error);
      return { count: 0, error };
    }
  }
};


