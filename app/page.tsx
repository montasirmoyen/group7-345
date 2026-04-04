import { HeroSection } from "@/components/hero-section";
import TestimonialsComponent from '@/components/testimonials'
import type { TestimonialItem } from '@/components/testimonials'
import { SwatchBookIcon, SearchIcon, StarIcon, SmartphoneIcon, LockKeyholeIcon, ShieldBanIcon } from 'lucide-react'
import Features from '@/components/features'

const featuresList = [
  {
    icon: SwatchBookIcon,
    title: 'Organized Workspace',
    description:
      "Replace messy spreadsheets with a clean, structured workspace. Keep every application, interview stage, and resume variant in one place for seamless management.",
    cardBorderColor: 'border-primary/40 hover:border-primary',
    avatarTextColor: 'text-primary',
    avatarBgColor: 'bg-primary/10'
  },
  {
    icon: SearchIcon,
    title: 'Kanban Pipeline',
    description:
      'Track every role from Applied to Offer with a drag-and-drop board built for real hiring workflows. Visualize your entire job search at a glance.',
    cardBorderColor: 'border-amber-600/40 hover:border-amber-600 dark:border-amber-400/40 dark:hover:border-amber-400',
    avatarTextColor: 'text-amber-600 dark:text-amber-400',
    avatarBgColor: 'bg-amber-600/10 dark:bg-amber-400/10'
  },
  {
    icon: SmartphoneIcon,
    title: 'Resume Mapping',
    description:
      'Map each resume version to each job opening so you always submit the most relevant profile for every opportunity without manual switching.',
    cardBorderColor: 'border-sky-600/40 hover:border-sky-600 dark:border-sky-400/40 dark:hover:border-sky-400',
    avatarTextColor: 'text-sky-600 dark:text-sky-400',
    avatarBgColor: 'bg-sky-600/10 dark:bg-sky-400/10'
  },
  {
    icon: StarIcon,
    title: 'Professional Follow-through',
    description:
      'Keep deadlines, interview rounds, and notes organized so your outreach stays consistent and polished. Never miss a follow-up again.',
    cardBorderColor: 'border-destructive/40 hover:border-destructive',
    avatarTextColor: 'text-destructive',
    avatarBgColor: 'bg-destructive/10'
  },
  {
    icon: LockKeyholeIcon,
    title: 'Time Savings',
    description:
      'Save 6+ hours weekly by eliminating manual data entry and spreadsheet chaos. Focus on interview prep and networking instead of formatting.',
    cardBorderColor: 'border-green-600/40 hover:border-green-600 dark:border-green-400/40 dark:hover:border-green-400',
    avatarTextColor: 'text-green-600 dark:text-green-400',
    avatarBgColor: 'bg-green-600/10 dark:bg-green-400/10'
  },
  {
    icon: ShieldBanIcon,
    title: '100% Organization',
    description:
      'Achieve complete organization of your job search. Every application tracked, every resume matched, every deadline remembered in one platform.',
    cardBorderColor: 'border-primary/40 hover:border-primary',
    avatarTextColor: 'text-primary',
    avatarBgColor: 'bg-primary/10'
  }
]

const testimonials: TestimonialItem[] = [
  {
    name: 'Zhipeng Huang',
    role: 'Software Engineer',
    company: 'ABC Corp',
    avatar: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png?width=40&height=40&format=auto',
    rating: 5,
    content: "Job Application Tracker replaced our messy spreadsheets with a clean, structured workspace. Managing applications has never been easier."
  },
  {
    name: 'Kanan Guliyev',
    role: 'Product Manager',
    company: 'XYZ Inc',
    avatar: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png?width=40&height=40&format=auto',
    rating: 4,
    content: "The Kanban board feature lets me visualize all my applications at a glance. I save hours every week compared to manual tracking."
  },
  {
    name: 'Sarmad Shah',
    role: 'Lead Designer',
    company: 'LMN Studio',
    avatar: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png?width=40&height=40&format=auto',
    rating: 5,
    content:
      "Mapping resumes to job openings is seamless. Job Application Tracker transformed how our team organizes and tracks applications."
  },
  {
    name: 'Beksultan Abila',
    role: 'Frontend Developer',
    company: 'OPQ Ltd',
    avatar: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-4.png?width=40&height=40&format=auto',
    rating: 4,
    content:
      'This tool eliminates manual data entry and spreadsheet chaos. We save hours every week managing our job applications.'
  }
]

export default function Page() {
  return (
    <div>
      <HeroSection />
      <Features featuresList={featuresList} />
      <TestimonialsComponent testimonials={testimonials} />
    </div>
  );
}