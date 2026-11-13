import {
  Accessibility,
  Armchair,
  Ban,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Car,
  Check,
  CircleHelp,
  Clock,
  Coffee,
  DoorOpen,
  File,
  FileText,
  FileX,
  Gauge,
  Globe,
  GraduationCap,
  Hand,
  Handshake,
  Hash,
  Headphones,
  House,
  IdCard,
  ListOrdered,
  Mail,
  MapPin,
  MessageSquare,
  Mic,
  Monitor,
  Phone,
  Target,
  Timer,
  Type,
  User,
  UserRound,
  Users,
  Volume2,
  Wrench,
} from 'lucide-react';

/**
 * The shared catalogues name their icons as plain strings so that nothing
 * in `@onboarding/contracts` depends on a React icon library. This maps
 * those names onto components.
 *
 * Known limitation: "refugee-card" falls back to the same card icon as a
 * Kebele ID because the icon set has nothing more specific. For sighted
 * low-literacy users the two documents should be visually distinct, which
 * needs real artwork rather than a generic icon set.
 */
const ICONS = {
  accessibility: Accessibility,
  armchair: Armchair,
  'building-2': Building2,
  briefcase: Briefcase,
  calendar: Calendar,
  car: Car,
  check: Check,
  clock: Clock,
  coffee: Coffee,
  'door-open': DoorOpen,
  file: File,
  'file-text': FileText,
  globe: Globe,
  'graduation-cap': GraduationCap,
  hand: Hand,
  handshake: Handshake,
  hash: Hash,
  headphones: Headphones,
  help: CircleHelp,
  home: House,
  house: House,
  'id-card': IdCard,
  level: Gauge,
  'list-ordered': ListOrdered,
  mail: Mail,
  'map-pin': MapPin,
  'message-square': MessageSquare,
  mic: Mic,
  monitor: Monitor,
  'no-document': FileX,
  passport: BookOpen,
  phone: Phone,
  'refugee-card': IdCard,
  stop: Ban,
  target: Target,
  timer: Timer,
  type: Type,
  user: User,
  'user-round': UserRound,
  users: Users,
  'volume-2': Volume2,
  wrench: Wrench,
};

/** Returns a component for a catalogue icon name, or a neutral fallback. */
export function getIcon(name) {
  return ICONS[name] ?? CircleHelp;
}
