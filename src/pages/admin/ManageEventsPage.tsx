import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService, adminService } from '../../services/api';
import { CollegeEvent, EventStatus } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Alert } from '../../components/common/Alert';
import {
  Calendar,
  Users,
  Trash2,
  Search,
  Eye,
  PlusCircle,
} from 'lucide-react';

export const ManageEventsPage: React.FC = () => {
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<CollegeEvent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadEvents();
  }, [statusFilter]);

  async function loadEvents() {
    try {
      setLoading(true);
      const res = await eventService.getAll({
        status: statusFilter || undefined,
        sort: 'desc',
      });
      if (res.success) {
        setEvents(res.events || []);
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: 'Failed to load events.' });
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (eventId: number, newStatus: EventStatus) => {
    try {
      setAlertInfo(null);
      const res = await adminService.updateEventStatus(eventId, newStatus);
      if (res.success) {
        setAlertInfo({ type: 'success', message: `Event status updated to ${newStatus}.` });
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e))
        );
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: 'Failed to update event status.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await eventService.delete(deleteTarget.id);
      if (res.success) {
        setAlertInfo({ type: 'success', message: 'Event permanently deleted.' });
        setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: 'Failed to delete event.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredEvents = events.filter((ev) =>
    ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ev.organizer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ev.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F2D4A]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Event Moderation & Oversight
          </h1>
          <p className="text-xs sm:text-sm text-[#8B9BB4] mt-1">
            Review event proposals, audit campus schedules, change status, or remove events.
          </p>
        </div>

        <Link
          to="/organizer/events/new"
          className="btn-primary text-xs self-start"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          <span>Post Official Event</span>
        </Link>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} />}

      {/* Filter and Search Bar */}
      <div className="academic-card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B9BB4] pointer-events-none" />
          <input
            type="text"
            placeholder="Search events by title, organizer, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base w-full pl-10 text-xs"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base w-full text-xs"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 skeleton-shimmer rounded-[14px]" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center academic-card space-y-2">
          <Calendar className="w-8 h-8 text-[#8B9BB4] mx-auto opacity-60" />
          <h3 className="text-sm font-semibold text-[#F8FAFC]">No events found</h3>
          <p className="text-xs text-[#8B9BB4]">No events matched the status or search filter.</p>
        </div>
      ) : (
        <div className="academic-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Organizer</th>
                  <th>Date & Venue</th>
                  <th>Enrollments</th>
                  <th>Status</th>
                  <th className="text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((ev) => (
                  <tr key={ev.id}>
                    {/* Event Info */}
                    <td>
                      <div className="font-semibold text-[#F8FAFC] line-clamp-1 max-w-xs">
                        <Link to={`/events/${ev.id}`} className="hover:text-[#3B82F6] transition-colors">
                          {ev.title}
                        </Link>
                      </div>
                      <div className="text-[11px] text-[#60A5FA] font-medium">
                        {ev.category_name} · #{ev.id}
                      </div>
                    </td>

                    {/* Organizer */}
                    <td>
                      <div className="font-medium text-[#CBD5E1]">{ev.organizer_name}</div>
                      <div className="text-[11px] text-[#8B9BB4]">{ev.organizer_email}</div>
                    </td>

                    {/* Date & Venue */}
                    <td className="text-[#CBD5E1]">
                      <div className="tabular-nums font-medium">{ev.date}</div>
                      <div className="text-[11px] text-[#8B9BB4] truncate max-w-[130px]">
                        {ev.venue}
                      </div>
                    </td>

                    {/* Registrations */}
                    <td className="tabular-nums">
                      <span className="font-semibold text-[#F8FAFC]">{ev.registered_count}</span>
                      <span className="text-[#8B9BB4]"> / {ev.max_participants}</span>
                    </td>

                    {/* Status Dropdown */}
                    <td>
                      <select
                        value={ev.status}
                        onChange={(e) => handleStatusChange(ev.id, e.target.value as EventStatus)}
                        className="px-2.5 py-1 text-xs bg-[#0F1829] border border-[#1F2D4A] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#F8FAFC] capitalize"
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/events/${ev.id}`}
                          className="p-1.5 text-[#8B9BB4] hover:text-[#F8FAFC] rounded-[8px] hover:bg-[#16223B] transition-colors"
                          title="View Event Page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(ev)}
                          className="p-1.5 text-[#8B9BB4] hover:text-[#EF4444] rounded-[8px] hover:bg-[#EF4444]/10 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Event Confirmation"
          maxWidth="sm"
          footer={
            <>
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary text-xs h-9"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="btn-danger text-xs h-9"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Event'}
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs text-[#CBD5E1]">
            <p>
              Are you sure you want to permanently delete <strong className="text-[#F8FAFC]">{deleteTarget.title}</strong>?
            </p>
            <p className="text-[#8B9BB4]">
              This will remove all associated attendee registrations and entry records from the college database.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
