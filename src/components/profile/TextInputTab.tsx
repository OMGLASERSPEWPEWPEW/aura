// src/components/profile/TextInputTab.tsx
// Port from UserBackstory.tsx - handles text/journal input
import { useState } from 'react';
import { FileText, Upload, Trash2, Plus } from 'lucide-react';
import type { TextInput } from '../../lib/db';

interface TextInputTabProps {
  textInputs: TextInput[];
  onTextInputsChange: (inputs: TextInput[]) => void;
}

export default function TextInputTab({ textInputs, onTextInputsChange }: TextInputTabProps) {
  const [currentText, setCurrentText] = useState('');
  const [currentLabel, setCurrentLabel] = useState('');

  // Handle File Uploads (Text/MD files)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newInputs: TextInput[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      newInputs.push({
        content: text,
        label: file.name,
        addedAt: new Date()
      });
    }

    onTextInputsChange([...textInputs, ...newInputs]);

    // Reset input
    event.target.value = '';
  };

  const handleAddText = () => {
    if (!currentText.trim()) return;

    const newInput: TextInput = {
      content: currentText.trim(),
      label: currentLabel.trim() || 'Manual Entry',
      addedAt: new Date()
    };

    onTextInputsChange([...textInputs, newInput]);
    setCurrentText('');
    setCurrentLabel('');
  };

  const removeInput = (index: number) => {
    onTextInputsChange(textInputs.filter((_, i) => i !== index));
  };

  const getTotalCharacters = () => {
    return textInputs.reduce((sum, input) => sum + input.content.length, 0);
  };

  return (
    <div className="space-y-6">
      {/* Text Input Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="text-indigo-600" size={20} />
          <h2 className="font-semibold text-gray-800">Your Story</h2>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Add journal entries, dating app bios, therapy notes, or any text that describes who you are
          and what you're looking for.
        </p>

        {/* Label Input */}
        <input
          type="text"
          value={currentLabel}
          onChange={(e) => setCurrentLabel(e.target.value)}
          placeholder="Label (e.g., 'My Hinge Bio', 'Journal Entry')"
          className="w-full p-2 border border-slate-200 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />

        {/* Text Area */}
        <textarea
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          placeholder="I'm looking for someone who... My ideal weekend is... I value..."
          className="w-full h-36 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />

        <div className="flex items-center justify-between mt-3">
          {/* File Upload */}
          <label className="flex items-center gap-2 text-sm text-indigo-600 font-medium cursor-pointer hover:text-indigo-800">
            <Upload size={16} />
            Upload .txt or .md files
            <input
              type="file"
              accept=".txt,.md,.markdown"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {/* Add Button */}
          <button
            onClick={handleAddText}
            disabled={!currentText.trim()}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={16} />
            Add Entry
          </button>
        </div>
      </div>

      {/* Added Entries List */}
      {textInputs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Added Entries ({textInputs.length})
            </h3>
            <span className="text-xs text-slate-500">
              {getTotalCharacters().toLocaleString()} characters total
            </span>
          </div>

          {textInputs.map((input, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800 truncate">
                      {input.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {input.content.length.toLocaleString()} chars
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {input.content}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Added {new Date(input.addedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeInput(index)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      {textInputs.length === 0 && (
        <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600">
          <h4 className="font-semibold text-slate-800 mb-2">Ideas for what to add:</h4>
          <ul className="list-disc pl-4 space-y-1">
            <li>Your current dating app bio</li>
            <li>Journal entries about past relationships</li>
            <li>Notes from therapy about relationship patterns</li>
            <li>A description of your ideal partner</li>
            <li>Reflections on what hasn't worked before</li>
          </ul>
        </div>
      )}
    </div>
  );
}
