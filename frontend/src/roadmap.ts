interface RoadmapItem {
    title: string;
    timeline: string;
    topics: Array<{ title: string; sub_topics: string[] }>;
}

interface RoadmapData {
    id: number;
    user_id: number;
    title: string;
    description?: string;
    roadmap_plan: RoadmapItem[];
    subject: string;
    goal: string;
    time_value: number;
    time_unit: string;
    model: string;
}

interface DayViewSubtopic {
    moduleTitle: string;
    topicTitle: string;
    subTopic: {
        id: string;
        title: string;
    };
}

export type { RoadmapItem, RoadmapData, DayViewSubtopic };