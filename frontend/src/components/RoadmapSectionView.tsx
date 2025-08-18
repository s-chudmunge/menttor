import React from 'react';
import Link from 'next/link';
import { FaBook, FaLaptopCode, FaChartBar, FaCheckCircle } from 'react-icons/fa';
import { RoadmapItem, QuizResult, RoadmapData, Topic } from '../../lib/api';

interface RoadmapSectionViewProps {
    roadmapBySection: RoadmapItem[];
    currentIndex: number;
    currentQuizResults: { [key: string]: QuizResult };
    roadmapData: RoadmapData;
    displayQuizReport: (subTopicId: string) => void;
    generateSubtopicId: (moduleTitle: string, topicTitle: string, subTopicTitle: string) => string;
}

const RoadmapSectionView: React.FC<RoadmapSectionViewProps> = ({
    roadmapBySection,
    currentIndex,
    currentQuizResults,
    roadmapData,
    displayQuizReport,
    generateSubtopicId,
}) => {
    const currentSection = roadmapBySection[currentIndex];

    if (!currentSection) {
        return <p className="text-gray-600 text-center">No section data available.</p>;
    }

    return (
        <div key={currentIndex} className="bg-white p-6 mb-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-2xl font-bold text-primary-700 mb-3">
                {currentSection.title}
            </h3>
            <p className="text-gray-500 text-sm mb-4">{currentSection.timeline}</p>

            {/* Module Progress Bar */}
            {(() => {
                const moduleTopics = currentSection.topics;
                let completedModuleTopics = 0;
                let totalModuleTopics = 0;

                moduleTopics.forEach(topic => {
                    topic.sub_topics.forEach(subTopic => {
                        totalModuleTopics++;
                        const subTopicId = generateSubtopicId(
                            currentSection.title,
                            topic.title,
                            subTopic
                        );
                        if (currentQuizResults[subTopicId] && currentQuizResults[subTopicId].completed) {
                            completedModuleTopics++;
                        }
                    });
                });

                const moduleProgress = totalModuleTopics === 0 ? 0 : (completedModuleTopics / totalModuleTopics) * 100;

                return (
                    <div className="mb-6">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-accent-500 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${moduleProgress}%` }}></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{completedModuleTopics} of {totalModuleTopics} topics completed</p>
                    </div>
                );
            })()}

            <div className="space-y-6">
                {currentSection.topics.map((topic: Topic, topicIdx: number) => (
                    <div key={topicIdx} className="border-t border-gray-200 pt-6 first:border-t-0 first:pt-0">
                        <h4 className="text-xl font-semibold text-gray-800 mb-4">{topic.title}</h4>
                        <div className="space-y-3">
                            {topic.sub_topics.map((subTopicTitle: string, subTopicIdx: number) => {
                                const subTopicId = generateSubtopicId(
                                    currentSection.title,
                                    topic.title,
                                    subTopicTitle
                                );
                                const result = currentQuizResults[subTopicId];
                                const isCompleted = result && result.completed;
                                const scoreDisplay = result ? ` (${result.score}/${result.total_questions})` : '';

                                return (
                                    <div key={subTopicIdx} className={`flex items-center p-4 rounded-lg shadow-sm transition-all duration-200 ${isCompleted ? 'bg-accent-50 hover:bg-accent-100' : 'bg-white hover:bg-gray-50'}`}>
                                        {isCompleted && <FaCheckCircle className="text-accent-500 text-xl mr-3" />}
                                        <label className="flex-grow text-gray-700 text-base cursor-pointer">{subTopicTitle}</label>
                                        <span className="ml-auto mr-4 font-bold text-primary-600">{scoreDisplay}</span>
                                        <Link href={`/learn?subtopic=${encodeURIComponent(subTopicTitle)}`} target="_blank" className="text-primary-500 hover:text-primary-700 text-xl mx-1" title={`Learn more about ${subTopicTitle}`}>
                                            <FaBook />
                                        </Link>
                                        <Link
                                            href={`/quiz?subtopic_id=${encodeURIComponent(subTopicId)}&subtopic=${encodeURIComponent(subTopicTitle)}&subject=${encodeURIComponent(roadmapData.subject)}&goal=${encodeURIComponent(roadmapData.goal)}&time_value=${roadmapData.time_value}&time_unit=${encodeURIComponent(roadmapData.time_unit)}&model=${encodeURIComponent(roadmapData.model)}&module_title=${encodeURIComponent(currentSection.title)}&topic_title=${encodeURIComponent(topic.title)}`}
                                            target="_blank"
                                            className="text-accent-500 hover:text-accent-700 text-xl mx-1"
                                            title={`Start quiz for ${subTopicTitle}`}
                                        >
                                            <FaLaptopCode />
                                        </Link>
                                        {isCompleted && (
                                            <button onClick={() => displayQuizReport(subTopicId)} className="text-primary-500 hover:text-primary-700 text-xl mx-1" title={`View quiz report for ${subTopicId}`}><FaChartBar /></button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoadmapSectionView;
