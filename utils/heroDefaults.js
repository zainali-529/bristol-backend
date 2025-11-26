const defaultHeroVariants = [
  {
    variantKey: 'hero-video',
    name: 'Cinematic Video Hero',
    description: 'Full-screen video hero with immersive background and floating actions.',
    isActive: false,
    order: 1,
    content: {
      badgeLabel: "Powering UK's Businesses",
      headline: 'We power your business with the best energy deals',
      subheadline:
        "Orca Business Solutions is a new name, but we're built on real experience. We work with UK businesses to help reduce costs, stay within rules, and plan for better outcomes.",
      primaryCta: {
        label: 'Explore Us',
        link: '/about',
        icon: 'ArrowDown',
      },
      secondaryCta: {
        label: 'Contact Us',
        link: '/contact',
        icon: 'ArrowUpRight',
      },
      background: {
        type: 'video',
        videoUrl: '/videos/hero-bg-video.mp4',
        overlay: false,
        particles: true,
      },
      buttons: {
        style: 'pill',
      },
    },
  },
  {
    variantKey: 'hero-interactive',
    name: 'Interactive Data Hero',
    description: 'Futuristic hero with animated background, morphing headlines, and floating cards.',
    isActive: false,
    order: 2,
    content: {
      badgeLabel: 'Energy Savings Made Simple',
      morphingPhrases: [
        'Save Thousands on Energy',
        'Switch in 2 Minutes',
        'Join 5,000+ Businesses',
        'Cut Bills by 23%',
      ],
      subheadline:
        "Compare energy prices from UK's top suppliers and start saving today. Our expert brokers find you the best deals in minutes.",
      primaryCta: {
        label: 'Get Free Quote',
        link: '/quote-calculator',
        icon: 'Calculator',
      },
      secondaryCta: {
        label: 'Speak to Expert',
        link: '/contact',
        icon: 'Phone',
      },
      showLiveTicker: true,
      benefitCards: [
        {
          icon: 'TrendingUp',
          title: '23%',
          subtitle: 'Average Savings',
          color: '#10b981',
          description: 'Average saving delivered to our customers',
        },
        {
          icon: 'Clock',
          title: '2 min',
          subtitle: 'Quick Quote',
          color: '#3b82f6',
          description: 'Get accurate quotes in minutes',
        },
        {
          icon: 'Users',
          title: '5,000+',
          subtitle: 'Happy Clients',
          color: '#f97316',
          description: 'Businesses we actively manage',
        },
        {
          icon: 'Shield',
          title: '£0',
          subtitle: 'Zero Fees',
          color: 'var(--primary)',
          description: 'No hidden fees or surprises',
        },
      ],
      stats: [
        {
          label: 'Contracts Managed',
          value: '12,500+',
        },
        {
          label: 'Ofgem Compliance',
          value: '100%',
        },
      ],
    },
  },
  {
    variantKey: 'hero-professional',
    name: 'Professional Trust Hero',
    description: 'Balanced corporate hero with trust indicators, stats, and compelling CTAs.',
    isActive: true,
    order: 3,
    content: {
      badgeLabel: "UK's Leading Energy Broker",
      headline: 'Cut Your Energy Bills by',
      highlight: {
        value: '23%',
        suffix: '',
        prefix: '',
      },
      subheadline:
        'Join 5,000+ UK businesses saving millions on energy costs. Get a free quote in 2 minutes with no commitment.',
      primaryCta: {
        label: 'Get Free Quote',
        link: '/quote-calculator',
        icon: 'Calculator',
      },
      secondaryCta: {
        label: 'Speak to Expert',
        link: '/contact',
        icon: 'Phone',
      },
      reviewScore: '4.9/5',
      reviewCount: '2,500+',
      recentSignups: '50+',
      background: {
        type: 'gradient',
        accentColor: '#3b82f6',
      },
      showTrustBadges: true,
    },
  },
];

module.exports = defaultHeroVariants;

