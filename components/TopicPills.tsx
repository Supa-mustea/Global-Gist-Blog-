
import React from 'react';

interface TopicPillsProps {
  topics: string[];
  activeTopic: string;
  onTopicSelect: (topic: string) => void;
}

export const TopicPills: React.FC<TopicPillsProps> = ({ topics, activeTopic, onTopicSelect }) => (
  <div className="mb-12">
    <h2 className="text-lg font-bold text-text-secondary mb-4">Explore Topics</h2>
    <div className="flex flex-wrap gap-3">
      {topics.map((topic) => (
        <button
          key={topic}
          onClick={() => onTopicSelect(topic)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            activeTopic === topic
              ? 'bg-accent text-white shadow-lg'
              : 'bg-secondary hover:bg-white/10 text-text-secondary'
          }`}
        >
          {topic}
        </button>
      ))}
    </div>
  </div>
);
