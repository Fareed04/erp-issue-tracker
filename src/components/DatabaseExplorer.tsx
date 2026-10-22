import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  RefreshCw, 
  Download, 
  Search, 
  Table as TableIcon, 
  Code2, 
  Copy, 
  Check, 
  ExternalLink, 
  FileJson, 
  ShieldCheck, 
  Layers, 
  X, 
  Eye,
  Clock,
  User
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { fetchEmailLogs } from '../services/email';
import * as XLSX from 'xlsx';

interface DatabaseExplorerProps {
  currentUserProfile: UserProfile;
}

type CollectionType = 'issues' | 'users' | 'comments' | 'activities' | 'emailLogs';

interface DocumentRecord {
  id: string;
  collection: CollectionType;
  data: Record<string, any>;
  summary: string;
  timestamp?: string;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({ currentUserProfile: _currentUserProfile }) => {
  const [selectedCollection, setSelectedCollection] = useState<CollectionType>('issues');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data stores
  const [records, setRecords] = useState<{ [key in CollectionType]: DocumentRecord[] }>({
    issues: [],
    users: [],
    comments: [],
    activities: [],
    emailLogs: []
  });

  // Selected document for inspector modal
  const [inspectedDoc, setInspectedDoc] = useState<DocumentRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const FIRESTORE_PROJECT_ID = 'ai-studio-7c0dd93f-ebad-4079-aee5-f45737d794af';
  const CONSOLE_URL = `https://console.firebase.google.com/project/${FIRESTORE_PROJECT_ID}/firestore`;

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Issues
      const issuesSnap = await getDocs(collection(db, 'issues'));
      const issuesList: DocumentRecord[] = issuesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          collection: 'issues',
          data,
          summary: data.title || doc.id,
          timestamp: data.created_at || data.updated_at
        };
      });

      // 2. Fetch Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList: DocumentRecord[] = usersSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          collection: 'users',
          data,
          summary: data.displayName || data.email || doc.id,
          timestamp: data.lastLoginAt || data.updated_at
        };
      });

      // 3. Fetch Comments and Activities across issues
      const commentsList: DocumentRecord[] = [];
      const activitiesList: DocumentRecord[] = [];

      await Promise.all(
        issuesList.map(async (issueDoc) => {
          try {
            // Comments subcollection
            const commentsSnap = await getDocs(collection(db, 'issues', issueDoc.id, 'comments'));
            commentsSnap.docs.forEach(cDoc => {
              const cData = cDoc.data();
              commentsList.push({
                id: cDoc.id,
                collection: 'comments',
                data: {
                  ...cData,
                  issueId: issueDoc.id,
                  issueTitle: issueDoc.data.title || 'Untitled Issue'
                },
                summary: cData.text ? (cData.text.length > 50 ? `${cData.text.slice(0, 50)}...` : cData.text) : cDoc.id,
                timestamp: cData.timestamp
              });
            });

            // Activities subcollection
            const activitiesSnap = await getDocs(collection(db, 'issues', issueDoc.id, 'activities'));
            activitiesSnap.docs.forEach(aDoc => {
              const aData = aDoc.data();
              activitiesList.push({
                id: aDoc.id,
                collection: 'activities',
                data: {
                  ...aData,
                  issueId: issueDoc.id,
                  issueTitle: issueDoc.data.title || 'Untitled Issue'
                },
                summary: `${aData.action || 'activity'}: ${aData.details || ''}`,
                timestamp: aData.timestamp
              });
            });
          } catch (err) {
            console.warn(`Could not fetch subcollections for issue ${issueDoc.id}`, err);
          }
        })
      );

      // 4. Fetch Email Logs
      const emailLogsData = await fetchEmailLogs();
      const emailLogsList: DocumentRecord[] = emailLogsData.map((log: any) => ({
        id: log.id || `log-${Math.random()}`,
        collection: 'emailLogs',
        data: log,
        summary: `To: ${log.to} - ${log.subject}`,
        timestamp: log.sentAt || log.timestamp
      }));

      // Sort chronological descending where possible
      const sortByTime = (a: DocumentRecord, b: DocumentRecord) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      };

      setRecords({
        issues: issuesList.sort(sortByTime),
        users: usersList.sort(sortByTime),
        comments: commentsList.sort(sortByTime),
        activities: activitiesList.sort(sortByTime),
        emailLogs: emailLogsList.sort(sortByTime)
      });
    } catch (error) {
      console.error('Failed to load database records:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // Filter records based on search query
  const currentRecords = useMemo(() => {
    const list = records[selectedCollection] || [];
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(r => {
      if (r.id.toLowerCase().includes(q)) return true;
      if (r.summary.toLowerCase().includes(q)) return true;
      return JSON.stringify(r.data).toLowerCase().includes(q);
    });
  }, [records, selectedCollection, searchQuery]);

  // Export current collection as JSON
  const handleExportJSON = () => {
    const exportData = currentRecords.map(r => ({
      _documentId: r.id,
      _collection: r.collection,
      ...r.data
    }));
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `${selectedCollection}_firestore_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export current collection as Excel / CSV
  const handleExportExcel = () => {
    const rows = currentRecords.map(r => {
      const flattened: Record<string, any> = {
        _id: r.id,
        _collection: r.collection
      };
      Object.entries(r.data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          flattened[key] = JSON.stringify(value);
        } else {
          flattened[key] = value ?? '';
        }
      });
      return flattened;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedCollection);
    XLSX.writeFile(workbook, `${selectedCollection}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const copyToClipboard = (text: string, type: 'id' | 'json') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  // Collection metadata definition
  const collectionsConfig = [
    { id: 'issues', label: 'Issues & Tasks', icon: Layers, count: records.issues.length, desc: 'Core ERP work items, bugs, blockers, and assignments' },
    { id: 'users', label: 'User Profiles', icon: User, count: records.users.length, desc: 'Registered user accounts, RBAC roles, and email notification configs' },
    { id: 'comments', label: 'Comments', icon: Code2, count: records.comments.length, desc: 'All collaboration threads and discussions attached to issues' },
    { id: 'activities', label: 'Audit Logs', icon: Clock, count: records.activities.length, desc: 'Complete historical timeline and change audit trails' },
    { id: 'emailLogs', label: 'Email Outbox', icon: FileJson, count: records.emailLogs.length, desc: 'Dispatched notifications, test emails, and delivery status' },
  ] as const;

  const totalDocumentsCount = 
    records.issues.length + 
    records.users.length + 
    records.comments.length + 
    records.activities.length + 
    records.emailLogs.length;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Top Banner / Cloud Info */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-tawny-port/10 text-tawny-port dark:bg-tawny-port/20 dark:text-rose-300 rounded-lg">
              <Database size={20} />
            </span>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
              Database Explorer & Audit Log
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Connected
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Directly inspect, query, and export live records stored in your Firestore database collections.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
              Project ID: {FIRESTORE_PROJECT_ID}
            </span>
            <span>·</span>
            <span>Total Records: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{totalDocumentsCount}</strong></span>
            <span>·</span>
            <span className="flex items-center gap-1 text-tawny-port dark:text-rose-400 font-medium">
              <ShieldCheck size={14} /> Admin Access Granted
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href={CONSOLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-colors shadow-xs"
            title="Open raw database console in Google Firebase"
          >
            <span>Cloud Console</span>
            <ExternalLink size={15} />
          </a>
          <button
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-tawny-port hover:bg-tawny-port/90 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh Records</span>
          </button>
        </div>
      </div>

      {/* Collection Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {collectionsConfig.map((col) => {
          const Icon = col.icon;
          const isSelected = selectedCollection === col.id;
          return (
            <button
              key={col.id}
              onClick={() => {
                setSelectedCollection(col.id);
                setSearchQuery('');
              }}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 border-tawny-port shadow-sm ring-1 ring-tawny-port'
                  : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`p-2 rounded-lg ${
                  isSelected 
                    ? 'bg-tawny-port text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  <Icon size={16} />
                </span>
                <span className="font-bold text-base text-slate-900 dark:text-white">
                  {col.count}
                </span>
              </div>
              <div>
                <h3 className={`text-sm font-bold truncate ${
                  isSelected ? 'text-tawny-port dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {col.label}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {col.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter & View Toolbar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${selectedCollection} by ID, text, title...`}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tawny-port"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* View Mode & Export Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon size={14} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'json'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Code2 size={14} />
              <span>Raw JSON</span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          {/* Export Dropdown / Buttons */}
          <button
            onClick={handleExportJSON}
            disabled={currentRecords.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            title="Download collection documents as JSON"
          >
            <FileJson size={14} />
            <span className="hidden md:inline">Export</span> JSON
          </button>

          <button
            onClick={handleExportExcel}
            disabled={currentRecords.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            title="Download collection documents as Excel / CSV"
          >
            <Download size={14} />
            <span className="hidden md:inline">Export</span> Excel
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tawny-port mb-3"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading collection documents from Firestore...</p>
        </div>
      ) : currentRecords.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Database size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No documents found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {searchQuery ? `No records matched query "${searchQuery}" in ${selectedCollection}.` : `The ${selectedCollection} collection is currently empty.`}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Structured Table View */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto smooth-scroll overscroll-x-contain">
            <table className="w-full text-left text-sm border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5 w-64">Document ID</th>
                  <th className="px-5 py-3.5">Primary Details</th>
                  <th className="px-5 py-3.5 w-44">Key Attributes</th>
                  <th className="px-5 py-3.5 w-44">Timestamp</th>
                  <th className="px-5 py-3.5 w-28 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
                {currentRecords.map((record) => {
                  return (
                    <tr 
                      key={record.id} 
                      onClick={() => setInspectedDoc(record)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                    >
                      {/* Document ID */}
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[160px] font-semibold text-tawny-port dark:text-rose-300">
                            {record.id}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(record.id, 'id');
                            }}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors opacity-0 group-hover:opacity-100"
                            title="Copy Document ID"
                          >
                            {copiedId === record.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Primary Details */}
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900 dark:text-white line-clamp-1">
                          {record.summary}
                        </div>
                        {selectedCollection === 'issues' && record.data.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {record.data.description}
                          </div>
                        )}
                        {selectedCollection === 'users' && record.data.email && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            {record.data.email}
                          </div>
                        )}
                        {selectedCollection === 'comments' && record.data.issueTitle && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            On: <span className="font-medium text-slate-700 dark:text-slate-300">{record.data.issueTitle}</span>
                          </div>
                        )}
                        {selectedCollection === 'activities' && record.data.userName && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            By: {record.data.userName}
                          </div>
                        )}
                        {selectedCollection === 'emailLogs' && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Recipient: {record.data.to}
                          </div>
                        )}
                      </td>

                      {/* Attributes */}
                      <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                        {selectedCollection === 'issues' && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="capitalize px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[11px] font-medium">
                              {record.data.status?.replace('_', ' ') || 'unknown'}
                            </span>
                            <span className="capitalize px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[11px] font-medium">
                              {record.data.priority || 'medium'}
                            </span>
                          </div>
                        )}
                        {selectedCollection === 'users' && (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            record.data.role === 'Admin'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {record.data.role || 'Developer'}
                          </span>
                        )}
                        {selectedCollection === 'comments' && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            User: {record.data.userName || record.data.userId || 'N/A'}
                          </span>
                        )}
                        {selectedCollection === 'activities' && (
                          <span className="font-mono text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                            {record.data.action || 'activity'}
                          </span>
                        )}
                        {selectedCollection === 'emailLogs' && (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            record.data.status === 'sent'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {record.data.status || 'logged'}
                          </span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {record.timestamp ? new Date(record.timestamp).toLocaleString() : 'N/A'}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedDoc(record);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-tawny-port dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Raw JSON Code Explorer */
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md p-4 overflow-x-auto smooth-scroll text-slate-200 font-mono text-xs max-h-[700px] overflow-y-auto">
          <pre className="leading-relaxed">
            {JSON.stringify(currentRecords.map(r => ({ _id: r.id, ...r.data })), null, 2)}
          </pre>
        </div>
      )}

      {/* Document Inspector Modal */}
      {inspectedDoc && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-tawny-port/10 text-tawny-port dark:bg-rose-950/40 dark:text-rose-300 rounded-lg">
                  <Database size={18} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Document Inspector
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>Collection: <strong className="text-slate-700 dark:text-slate-300 font-mono">{inspectedDoc.collection}</strong></span>
                    <span>·</span>
                    <span className="font-mono">{inspectedDoc.id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(JSON.stringify(inspectedDoc.data, null, 2), 'json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                  title="Copy document JSON"
                >
                  {copiedJson ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 smooth-scroll overscroll-y-contain">
              {/* Document ID Card */}
              <div className="bg-slate-50 dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    Document Path
                  </span>
                  <p className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate select-all">
                    /{inspectedDoc.collection}/{inspectedDoc.id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`/${inspectedDoc.collection}/${inspectedDoc.id}`, 'id')}
                  className="shrink-0 p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                  title="Copy Document Path"
                >
                  {copiedId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Key-Value Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Field Breakdown
                </h3>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/70 text-xs font-sans">
                  {Object.entries(inspectedDoc.data).map(([key, value]) => {
                    const valueType = typeof value;
                    const isObject = valueType === 'object' && value !== null;
                    return (
                      <div key={key} className="p-3 bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="sm:w-1/3 flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{key}</span>
                          <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 rounded">
                            {Array.isArray(value) ? 'array' : isObject ? 'object' : valueType}
                          </span>
                        </div>
                        <div className="sm:w-2/3 font-mono text-slate-600 dark:text-slate-300 break-all bg-slate-50 dark:bg-slate-900/60 p-2 rounded border border-slate-100 dark:border-slate-800">
                          {isObject ? JSON.stringify(value, null, 2) : String(value ?? 'null')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Raw JSON Code Block */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Raw JSON Payload
                </h3>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 max-h-64 overflow-y-auto">
                  <pre>{JSON.stringify(inspectedDoc.data, null, 2)}</pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setInspectedDoc(null)}
                className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
