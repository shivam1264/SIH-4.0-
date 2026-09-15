import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Volume2,
  RefreshCw,
  Info,
  Check,
} from 'lucide-react';
import {
  parseQuestionsExcelFile,
  downloadSampleExcelTemplate,
  downloadSampleCsvTemplate,
  type ParseExcelResult,
  type ParsedQuestionRow,
} from '../utils/excelQuestionParser';
import { speechService } from '../services/speechService';
import { toast } from '../context/ToastContext';

interface ExcelQuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedQuestions: ParsedQuestionRow[]) => void;
}

export const ExcelQuestionImportModal: React.FC<ExcelQuestionImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseResult, setParseResult] = useState<ParseExcelResult | null>(null);
  const [filterView, setFilterView] = useState<'all' | 'valid' | 'invalid'>('all');

  // Overrides / Defaults
  const [defaultSubject, setDefaultSubject] = useState('General Awareness');
  const [defaultDifficulty, setDefaultDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.', 'Invalid File Format');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    try {
      const result = await parseQuestionsExcelFile(file, {
        defaultSubject,
        defaultDifficulty,
      });
      setParseResult(result);

      if (result.validQuestions.length === 0) {
        toast.warning(
          `Parsed ${result.totalRows} rows, but found 0 valid questions. Please ensure required columns (Question, Option A, Option B, Correct Answer) are present.`,
          'Validation Warning'
        );
      } else {
        toast.success(
          `Successfully parsed ${result.validQuestions.length} valid questions from "${file.name}"!`,
          'File Processed'
        );
      }
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      toast.error(err.message || 'Failed to parse the file. Please check format.', 'Parsing Error');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleTestSpeech = (text: string) => {
    speechService.speak(text);
  };

  const handleSubmit = async () => {
    if (!parseResult || parseResult.validQuestions.length === 0) {
      toast.error('There are no valid questions to import.', 'Import Blocked');
      return;
    }

    setIsSubmitting(true);
    try {
      await onImportSuccess(parseResult.validQuestions);
      toast.success(
        `Successfully imported ${parseResult.validQuestions.length} questions into official Question Bank!`,
        'Bulk Import Completed'
      );
      handleReset();
      onClose();
    } catch (err: any) {
      console.error('Import failed:', err);
      toast.error(err.message || 'Failed to import questions', 'Import Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParseResult(null);
    setFilterView('all');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayedRows = parseResult
    ? filterView === 'valid'
      ? parseResult.validQuestions
      : filterView === 'invalid'
      ? parseResult.invalidRows
      : [...parseResult.validQuestions, ...parseResult.invalidRows].sort((a, b) => a.rowNumber - b.rowNumber)
    : [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-excel-title"
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          border: '2px solid var(--border)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '0.6rem',
                backgroundColor: 'rgba(5, 150, 105, 0.15)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2
                id="modal-excel-title"
                style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}
              >
                Bulk Question Import via Excel / CSV
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Upload .xlsx, .xls, or .csv sheets with automatic validation and speech audio preview
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--text-muted)' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Top Actions: Download Templates */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Info size={20} color="var(--primary)" />
              <div style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
                <strong>Need the format?</strong> Download a pre-filled sample template with standard columns and guidelines.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={downloadSampleExcelTemplate}
                className="btn-ghost"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  border: '1px solid #059669',
                  color: '#059669',
                  fontWeight: 600,
                }}
              >
                <Download size={14} /> Download Sample Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={downloadSampleCsvTemplate}
                className="btn-ghost"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                <Download size={14} /> Download Sample CSV
              </button>
            </div>
          </div>

          {/* Upload Drop Zone */}
          {!parseResult && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleBrowseClick}
              style={{
                border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '0.85rem',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: dragOver ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '1.5rem',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                {isParsing ? <RefreshCw size={28} className="animate-spin" /> : <UploadCloud size={28} />}
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text)' }}>
                {isParsing ? 'Parsing questions sheet...' : 'Drag & drop your Excel sheet here or click to browse'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv) up to 10MB
              </p>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginTop: '1rem',
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--bg-surface)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '1rem',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Supported columns:</span>
                <strong style={{ color: 'var(--text)' }}>Question, Option A, Option B, Option C, Option D, Correct Answer, Topic, Difficulty</strong>
              </div>
            </div>
          )}

          {/* After File is Parsed: File Info & Controls */}
          {parseResult && (
            <div>
              {/* File details card */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '0.5rem',
                      backgroundColor: 'rgba(5, 150, 105, 0.1)',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                      {parseResult.fileName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Sheet: <strong>{parseResult.selectedSheet}</strong> • Total Rows Analyzed: {parseResult.totalRows}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-ghost"
                    style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <RefreshCw size={13} /> Upload Another File
                  </button>
                </div>
              </div>

              {/* Status metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  onClick={() => setFilterView('all')}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '0.65rem',
                    backgroundColor: 'var(--bg-card)',
                    border: `1.5px solid ${filterView === 'all' ? 'var(--primary)' : 'var(--border)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Parsed</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
                    {parseResult.totalRows}
                  </div>
                </div>

                <div
                  onClick={() => setFilterView('valid')}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '0.65rem',
                    backgroundColor: 'rgba(5, 150, 105, 0.08)',
                    border: `1.5px solid ${filterView === 'valid' ? '#059669' : 'rgba(5, 150, 105, 0.3)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={13} /> Valid Questions Ready
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
                    {parseResult.validQuestions.length}
                  </div>
                </div>

                <div
                  onClick={() => setFilterView('invalid')}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '0.65rem',
                    backgroundColor: parseResult.invalidRows.length > 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-card)',
                    border: `1.5px solid ${
                      filterView === 'invalid'
                        ? '#ef4444'
                        : parseResult.invalidRows.length > 0
                        ? 'rgba(239, 68, 68, 0.3)'
                        : 'var(--border)'
                    }`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: parseResult.invalidRows.length > 0 ? '#ef4444' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertTriangle size={13} /> Missing Info / Warnings
                  </div>
                  <div
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: parseResult.invalidRows.length > 0 ? '#ef4444' : 'var(--text)',
                    }}
                  >
                    {parseResult.invalidRows.length}
                  </div>
                </div>
              </div>

              {/* Data Preview Table */}
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-card)',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-surface)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>
                    Sheet Preview ({displayedRows.length} {filterView === 'all' ? 'rows' : filterView} shown)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Click row preview to test phonetic speech narration
                  </div>
                </div>

                <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  {displayedRows.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No rows matching current filter.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {displayedRows.map((row, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.85rem 1rem',
                            borderBottom: '1px solid var(--border)',
                            backgroundColor: !row.isValid ? 'rgba(239, 68, 68, 0.04)' : undefined,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '0.5rem',
                              marginBottom: '0.4rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '0.3rem',
                                  backgroundColor: 'var(--bg-surface)',
                                  border: '1px solid var(--border)',
                                  fontWeight: 600,
                                }}
                              >
                                Row #{row.rowNumber}
                              </span>
                              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                                {row.topic}
                              </span>
                              <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                                {row.difficulty}
                              </span>
                              {row.isValid ? (
                                <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                                  ✓ Valid
                                </span>
                              ) : (
                                <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>
                                  ⚠️ Issues: {row.errors.join('; ')}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleTestSpeech(row.phoneticAudioPreview || row.q)}
                              className="btn-ghost"
                              style={{
                                fontSize: '0.72rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.5rem',
                                color: 'var(--primary)',
                              }}
                            >
                              <Volume2 size={13} /> Listen
                            </button>
                          </div>

                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.4rem' }}>
                            {row.q || '<Question text missing>'}
                          </div>

                          {/* Options grid */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                              gap: '0.35rem',
                              fontSize: '0.78rem',
                            }}
                          >
                            {row.options.map((opt, optIdx) => {
                              const isCorrect = optIdx === row.correct;
                              return (
                                <div
                                  key={optIdx}
                                  style={{
                                    padding: '0.3rem 0.5rem',
                                    borderRadius: '0.35rem',
                                    backgroundColor: isCorrect ? 'rgba(5, 150, 105, 0.12)' : 'var(--bg-surface)',
                                    border: `1px solid ${isCorrect ? '#059669' : 'var(--border)'}`,
                                    color: isCorrect ? '#059669' : 'var(--text)',
                                    fontWeight: isCorrect ? 700 : 400,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <span>
                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                  </span>
                                  {isCorrect && <Check size={12} strokeWidth={3} />}
                                </div>
                              );
                            })}
                          </div>

                          {row.explanation && (
                            <div
                              style={{
                                marginTop: '0.35rem',
                                fontSize: '0.74rem',
                                color: 'var(--text-muted)',
                                fontStyle: 'italic',
                              }}
                            >
                              Explanation: {row.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {parseResult ? (
              <span>
                <strong>{parseResult.validQuestions.length}</strong> questions ready to import into official bank.
              </span>
            ) : (
              <span>Select or drop an Excel/CSV file to proceed.</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-ghost" disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary"
              disabled={!parseResult || parseResult.validQuestions.length === 0 || isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#059669',
                borderColor: '#059669',
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Importing...
                </>
              ) : (
                <>
                  <FileSpreadsheet size={15} /> Import {parseResult ? parseResult.validQuestions.length : 0} Questions
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelQuestionImportModal;
