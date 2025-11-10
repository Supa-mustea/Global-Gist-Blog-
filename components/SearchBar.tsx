
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (topic: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-grow flex items-center bg-secondary rounded-lg p-1 shadow-md">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Or search for any topic..."
        className="w-full bg-transparent p-3 focus:outline-none text-text-primary placeholder-text-secondary"
      />
      <button
        type="submit"
        className="bg-accent hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-300"
      >
        Search
      </button>
    </form>
  );
};
