// @ts-nocheck
import React from 'react';
import Link from 'next/link';
import { FaBook, FaLaptopCode, FaChartBar, FaCheckCircle } from 'react-icons/fa';
import { DayViewSubtopic, QuizResult, RoadmapData } from '../../lib/api';

interface RoadmapDayViewProps {
    roadmapByDay: DayViewSubtopic[][];
    currentIndex: number;
    currentQuizResults: { [key: string]: QuizResult };
    roadmapData: RoadmapData;
    displayQuizReport: (subTopicId: string) => void;
}

const RoadmapDayView: React.FC<RoadmapDayViewProps> = ({
    roadmapByDay,
    currentIndex,
    currentQuizResults,
    roadmapData,
    displayQuizReport,
}) => {
    const currentDayContent = roadmapByDay[currentIndex];

    if (!currentDayContent || currentDayContent.length === 0) {
        return <p className="text-gray-600 text-center">No content for this day.</p>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-primary-700 mb-4 text-center">Day {currentIndex + 1}</h3>
            {currentDayContent.map((item: DayViewSubtopic, itemIdx: number) => {
                const result = currentQuizResults[item.subTopic.id];
                const isCompleted = result && result.completed;
                const scoreDisplay = result ? ` (${result.score}/${result.total_questions})` : '';

                return (
                    <div key={itemIdx} className={`flex items-center p-4 rounded-lg shadow-sm transition-all duration-200 ${isCompleted ? 'bg-accent-50 hover:bg-accent-100' : 'bg-white hover:bg-gray-50'}`}>
                        {isCompleted && <FaCheckCircle className="text-accent-500 text-xl mr-3" />}
                        <label className="flex-grow text-gray-700 text-base cursor-pointer">
                            {item.subTopic.title} <span className="text-gray-500 text-sm">(from {item.moduleTitle} - {item.topicTitle})</span>
                        </label>
                        <span className="ml-auto mr-4 font-bold text-primary-600">{scoreDisplay}</span>
                        <Link href={`/learn?subtopic=${encodeURIComponent(item.subTopic.title)}`} target="_blank" className="text-primary-500 hover:text-primary-700 text-xl mx-1" title={`Learn more about ${item.subTopic.title}`}>
                            <FaBook />
                        </Link>
                        <Link
                            href={`/quiz?subtopic_id=${encodeURIComponent(item.subTopic.id)}&subtopic=${encodeURIComponent(item.subTopic.title)}&subject=${encodeURIComponent(roadmapData.subject)}&goal=${encodeURIComponent(roadmapData.goal)}&time_value=${roadmapData.time_value}&time_unit=${encodeURIComponent(roadmapData.time_unit)}&model=${encodeURIComponent(roadmapData.model)}&module_title=${encodeURIComponent(item.moduleTitle)}&topic_title=${encodeURIComponent(item.topicTitle)}`}
                            target="_blank"
                            className="text-accent-500 hover:text-accent-700 text-xl mx-1"
                            title={`Start quiz for ${item.subTopic.title}`}
                        >
                            <FaLaptopCode />
                        </Link>
                        {isCompleted && (
                            <button onClick={() => displayQuizReport(item.subTopic.id)} className="text-primary-500 hover:text-primary-700 text-xl mx-1" title={`View quiz report for ${item.subTopic.id}`}><FaChartBar /></button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default RoadmapDayView;
