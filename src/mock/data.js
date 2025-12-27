// Mock data for all entities

const generateId = () => Math.random().toString(36).substr(2, 9);

export const seedData = {
  users: [
    {
      id: '1',
      email: 'client@example.com',
      role: 'client',
      name: 'John Company',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'freelancer@example.com',
      role: 'freelancer',
      name: 'Jane Developer',
      createdAt: new Date().toISOString(),
    },
  ],
  projects: [
    {
      id: '1',
      clientId: '1',
      title: 'Senior UiPath Developer',
      company: 'TechCorp Inc',
      location: 'REMOTE',
      type: 'FULL-TIME',
      salary: '$120K-$150K',
      urgency: 'HIGH',
      status: 'open',
      automationType: 'UiPath',
      industry: 'Technology',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      clientId: '1',
      title: 'RPA Solution Architect',
      company: 'AutomateNow',
      location: 'NEW YORK, NY',
      type: 'FULL-TIME',
      salary: '$140K-$180K',
      urgency: 'CRITICAL',
      status: 'open',
      automationType: 'UiPath',
      industry: 'Consulting',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      clientId: '1',
      title: 'Automation Anywhere Lead',
      company: 'Digital First',
      location: 'SAN FRANCISCO, CA',
      type: 'FULL-TIME',
      salary: '$130K-$160K',
      urgency: 'HIGH',
      status: 'open',
      automationType: 'Automation Anywhere',
      industry: 'Technology',
      createdAt: new Date().toISOString(),
    },
    {
      id: '4',
      clientId: '1',
      title: 'Blue Prism Developer',
      company: 'FinanceBot',
      location: 'REMOTE',
      type: 'CONTRACT',
      salary: '$100K-$130K',
      urgency: 'MEDIUM',
      status: 'open',
      automationType: 'Blue Prism',
      industry: 'Finance',
      createdAt: new Date().toISOString(),
    },
    {
      id: '5',
      clientId: '1',
      title: 'RPA Business Analyst',
      company: 'ProcessPro',
      location: 'CHICAGO, IL',
      type: 'FULL-TIME',
      salary: '$90K-$110K',
      urgency: 'MEDIUM',
      status: 'open',
      automationType: 'RPA',
      industry: 'Business Services',
      createdAt: new Date().toISOString(),
    },
    {
      id: '6',
      clientId: '1',
      title: 'Junior RPA Developer',
      company: 'StartupBot',
      location: 'REMOTE',
      type: 'FULL-TIME',
      salary: '$70K-$90K',
      urgency: 'LOW',
      status: 'open',
      automationType: 'UiPath',
      industry: 'Technology',
      createdAt: new Date().toISOString(),
    },
  ],
  freelancers: [
    {
      id: '1',
      userId: '2',
      skills: ['UiPath', 'Automation Anywhere'],
      experience: 'Senior',
      availability: 'Available',
      hourlyRate: 75,
      portfolio: 'https://portfolio.example.com',
      rating: 4.8,
    },
  ],
  developers: [
    {
      id: '1',
      name: 'Alex RPA Expert',
      techStack: ['UiPath', 'Blue Prism', 'Python'],
      certifications: ['UiPath Advanced RPA Developer', 'Blue Prism Certified Developer'],
      industryExperience: ['Finance', 'Healthcare', 'Manufacturing'],
      rating: 4.9,
      missionsCompleted: 45,
    },
  ],
  trainers: [
    {
      id: '1',
      name: 'Dr. Sarah Automation',
      coursesOffered: ['UiPath Foundation', 'Advanced RPA Development', 'RPA Architecture'],
      yearsExperience: 8,
      pricing: '$150/hour',
      rating: 5.0,
    },
  ],
  jobs: [
    {
      id: '1',
      title: 'Senior RPA Developer',
      company: 'Tech Corp',
      location: 'Remote',
      skills: ['UiPath', 'C#', 'SQL'],
      status: 'open',
      createdAt: new Date().toISOString(),
    },
  ],
};

// LocalStorage helpers
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },
};

// Initialize localStorage with seed data if empty
export const initializeMockData = () => {
  if (!storage.get('rpa_helpline_data_initialized')) {
    storage.set('rpa_helpline_users', seedData.users);
    storage.set('rpa_helpline_projects', seedData.projects);
    storage.set('rpa_helpline_freelancers', seedData.freelancers);
    storage.set('rpa_helpline_developers', seedData.developers);
    storage.set('rpa_helpline_trainers', seedData.trainers);
    storage.set('rpa_helpline_jobs', seedData.jobs);
    storage.set('rpa_helpline_data_initialized', true);
  }
};

// Get data from localStorage
export const getMockData = (key) => {
  const dataKey = `rpa_helpline_${key}`;
  return storage.get(dataKey, []);
};

// Save data to localStorage
export const saveMockData = (key, data) => {
  const dataKey = `rpa_helpline_${key}`;
  storage.set(dataKey, data);
};

// Add new item to mock data
export const addMockData = (key, item) => {
  const data = getMockData(key);
  const newItem = { ...item, id: generateId(), createdAt: new Date().toISOString() };
  data.push(newItem);
  saveMockData(key, data);
  return newItem;
};

// Update item in mock data
export const updateMockData = (key, id, updates) => {
  const data = getMockData(key);
  const index = data.findIndex(item => item.id === id);
  if (index !== -1) {
    data[index] = { ...data[index], ...updates };
    saveMockData(key, data);
    return data[index];
  }
  return null;
};

