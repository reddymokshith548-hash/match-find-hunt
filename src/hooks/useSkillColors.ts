import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SkillCategory {
  id: string;
  name: string;
  color_code: string;
}

interface SkillMapping {
  skill_name: string;
  category_id: string;
}

export const useSkillColors = () => {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [mappings, setMappings] = useState<SkillMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkillData();
  }, []);

  const fetchSkillData = async () => {
    try {
      const [categoriesData, mappingsData] = await Promise.all([
        supabase.from('skill_categories').select('*'),
        supabase.from('skill_category_mapping').select('*')
      ]);

      if (categoriesData.data) setCategories(categoriesData.data);
      if (mappingsData.data) setMappings(mappingsData.data);
    } catch (error) {
      console.error('Error fetching skill data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillColor = (skillName: string): string => {
    const mapping = mappings.find(m => 
      m.skill_name.toLowerCase() === skillName.toLowerCase()
    );
    
    if (mapping) {
      const category = categories.find(c => c.id === mapping.category_id);
      if (category) return category.color_code;
    }
    
    // Default color if no mapping found
    return 'hsl(217, 91%, 60%)';
  };

  const getSkillCategory = (skillName: string): string | null => {
    const mapping = mappings.find(m => 
      m.skill_name.toLowerCase() === skillName.toLowerCase()
    );
    
    if (mapping) {
      const category = categories.find(c => c.id === mapping.category_id);
      return category?.name || null;
    }
    
    return null;
  };

  return { getSkillColor, getSkillCategory, loading };
};
