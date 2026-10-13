import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registrationService } from '../../services/api';
import { Registration } from '../../types';
import { TicketModal } from '../../components/common/TicketModal';
import { RealtimeNotificationPanel } from '../../components/student/RealtimeNotificationPanel';
import { CountUpNumber } from '../../components/common/CountUpNumber';
import { getEventTimingInfo } from '../../utils/eventTiming';
import {
  Calendar,
  Ticket,
  CheckCircle,
  ArrowRight,
  MapPin,
  Compass,
  QrCode,
  FileText,
  Clock,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketModalReg, setTicketModalReg] = useState<Registration | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await registrationService.getMyRegistrations();
        if (res.success) {
          setRegistrations(res.registrations || []);
        }
      } catch (err) {
        console.error('Failed to load student registrations', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const confirmedRegistrations = registrations.filter((r) => r.registration_status === 'confirmed');
  const upcomingRegistrations = confirmedRegistrations.filter(
    (r) => new Date(r.event_date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );
  const attendedCount = registrations.filter((r) => r.attendance_status === 'present').length;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F2D4A]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Student Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#8B9BB4] mt-1">
            Welcome back, <span className="text-[#F8FAFC] font-semibold">{user?.name}</span> · Track your verified event passes, door check-ins, and reminders.
          </p>
        </div>
        <Link
          to="/events"
          className="btn-primary self-start"
        >
          <Compass className="w-4 h-4 mr-1.5" />
          <span>Browse Events</span>
        </Link>
      </div>

      {/* Metric Cards: Tinted circle, big number, label, small trend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Metric 1 */}
        <div className="academic-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8B9BB4]">Upcoming Events</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#3B82F6]/15 text-[#60A5FA] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#F8FAFC] tabular-nums tracking-tight">
              <CountUpNumber value={upcomingRegistrations.length} />
            </div>
            <div className="text-[11px] text-[#8B9BB4] mt-1">
              Scheduled on your calendar
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="academic-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8B9BB4]">Confirmed Passes</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#22D3EE]/15 text-[#22D3EE] flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#F8FAFC] tabular-nums tracking-tight">
              <CountUpNumber value={confirmedRegistrations.length} />
            </div>
            <div className="text-[11px] text-[#8B9BB4] mt-1">
              Active student entry passes
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="academic-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8B9BB4]">Events Attended</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#22C55E]/15 text-[#4ADE80] flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#F8FAFC] tabular-nums tracking-tight">
              <CountUpNumber value={attendedCount} />
            </div>
            <div className="text-[11px] text-[#4ADE80] font-medium mt-1">
              Verified door check-ins
            </div>
          </div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Upcoming Registered Events List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#F8FAFC]">
              Upcoming Registered Events
            </h2>
            <Link
              to="/student/registrations"
              className="text-xs font-semibold text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-0.5 transition-colors"
            >
              <span>View all passes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 skeleton-shimmer rounded-[14px]"
                />
              ))}
            </div>
          ) : upcomingRegistrations.length === 0 ? (
            <div className="p-10 text-center academic-card space-y-3">
              <Calendar className="w-10 h-10 text-[#8B9BB4] mx-auto opacity-60" />
              <p className="text-sm font-medium text-[#CBD5E1]">
                You haven't registered for any upcoming events yet.
              </p>
              <Link
                to="/events"
                className="btn-primary text-xs"
              >
                Find an Event
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingRegistrations.slice(0, 4).map((reg) => {
                const timing = getEventTimingInfo({
                  date: reg.event_date,
                  start_time: reg.start_time,
                  end_time: reg.end_time,
                });

                return (
                  <div
                    key={reg.registration_id}
                    className="academic-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#3B82F6]/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30">
                          {reg.category_name}
                        </span>

                        {timing.isOngoing && (
                          <span className="bg-[#22C55E]/20 text-[#4ADE80] border border-[#22C55E]/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
                            </span>
                            <span>LIVE NOW</span>
                          </span>
                        )}

                        {timing.isUpcoming && (
                          <span className="bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/40 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {timing.countdownText || 'Upcoming'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-[#F8FAFC]">
                        <Link to={`/events/${reg.event_id}`} className="hover:text-[#3B82F6] transition-colors">
                          {reg.event_title}
                        </Link>
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#8B9BB4]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span className="tabular-nums font-medium text-[#CBD5E1]">{reg.event_date}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8B9BB4]" />
                          <span>{reg.event_venue}</span>
                        </span>
                      </div>
                    </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {reg.google_form_url && (
                      <a
                        href={reg.google_form_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-xs h-9 inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#8B9BB4]" />
                        <span>Form</span>
                      </a>
                    )}

                    <button
                      onClick={() => setTicketModalReg(reg)}
                      className="btn-primary text-xs h-9"
                    >
                      <QrCode className="w-3.5 h-3.5 mr-1" />
                      <span>Ticket Pass</span>
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Campus Alerts */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#F8FAFC]">
            Campus Broadcasts
          </h2>
          <div className="academic-card p-4">
            <RealtimeNotificationPanel />
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {ticketModalReg && (
        <TicketModal
          isOpen={!!ticketModalReg}
          onClose={() => setTicketModalReg(null)}
          registration={ticketModalReg}
        />
      )}
    </div>
  );
};
