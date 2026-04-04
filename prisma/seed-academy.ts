import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const chapters = [
  {
    slug: 'habit-loop',
    title: 'The Habit Loop',
    subtitle: 'Understanding the neurological pattern behind every habit',
    category: 'wellness',
    orderIndex: 1,
    readTimeMin: 6,
    minPlanSlug: 'free',
    keyTakeaways: [
      'Every habit follows a three-step loop: cue, routine, reward, which operates in the basal ganglia',
      'The basal ganglia converts repeated behaviors into automatic patterns, freeing the prefrontal cortex for new tasks',
      'Identifying your existing cues is the first step to changing any habit',
      'Rewards create dopamine signals that strengthen the neural pathway, making the habit more automatic over time',
      'You cannot eliminate a habit entirely; you must replace the routine while keeping the cue and reward'
    ],
    body: `## The Engine Behind Every Behavior

Every morning, millions of people reach for their phone before their feet touch the floor. They don't think about it. They don't decide to do it. It just happens. This automatic behavior is the product of a neurological loop that governs everything from brushing your teeth to checking social media, the habit loop.

## Cue, Routine, Reward

Charles Duhigg, in his influential 2012 work, popularized a framework originally mapped by researchers at MIT: every habit consists of three components.

**The Cue** is a trigger that tells your brain to enter automatic mode. It can be a time of day (7 AM alarm), an emotional state (feeling bored), a location (sitting at your desk), a preceding action (finishing lunch), or the presence of certain people.

**The Routine** is the behavior itself, the thing you do on autopilot. It can be physical (going for a run), mental (visualizing a goal), or emotional (reaching for comfort food when stressed).

**The Reward** is what your brain gets out of it. Rewards satisfy a craving, whether it's a sugar rush, social validation, stress relief, or a sense of accomplishment. Over time, the reward teaches the brain that this loop is worth remembering and automating.

## The Basal Ganglia: Your Autopilot

Wood and Neal (2007) demonstrated that approximately 43% of daily behaviors are performed automatically, without conscious decision-making. This automation happens in the basal ganglia, a cluster of structures deep in the brain that handle procedural memory and habit formation.

When you first learn a behavior, your prefrontal cortex (the decision-making center) is highly active. But as the behavior is repeated in consistent contexts, the basal ganglia takes over. Brain scans show that once a habit is established, prefrontal cortex activity drops dramatically: the brain is literally conserving energy by running the behavior on autopilot.

This is why habits feel effortless once formed and why they are so hard to break. The neural pathway doesn't disappear; it just gets overridden by stronger pathways.

## Craving: The Hidden Fourth Element

Research since Duhigg's original framework has added nuance. The real driver of the loop is not the reward itself but the craving, the anticipation of the reward. Wolfram Schultz's work on dopamine showed that after a habit is established, dopamine spikes at the cue, not the reward. Your brain starts wanting the reward the moment it detects the trigger.

This is why someone trying to quit smoking feels an intense urge when they step outside after a meal (the cue), even before lighting up. The craving is what powers the loop.

## How to Use the Habit Loop

**To build a new habit:**
- Choose a clear, consistent cue (e.g., "after I pour my morning coffee")
- Define a simple routine (e.g., "I will write in my journal for 2 minutes")
- Ensure an immediate reward (e.g., a checkmark on your tracker, a moment of satisfaction)
- Repeat in the same context until automaticity develops

**To change an existing habit:**
- Identify the cue that triggers the unwanted behavior
- Determine the real reward you're seeking (Is it distraction? Social connection? Energy?)
- Replace the routine with a healthier alternative that delivers a similar reward
- Keep the cue and reward the same; only the routine changes

## The Golden Rule of Habit Change

Duhigg calls it the "Golden Rule": you can never truly extinguish a bad habit. The neural pathway remains. But you can overwrite it by inserting a new routine between the existing cue and reward. Alcoholics Anonymous works on this principle: the cue (stress, social situations) and the reward (relief, belonging) remain, but the routine shifts from drinking to attending meetings and calling a sponsor.

Understanding the habit loop gives you a map of your own behavior. Once you can see the cue, routine, and reward, you hold the leverage to redesign any habit in your life.`,
    quizData: {
      questions: [
        {
          question: 'What are the three components of the habit loop?',
          options: ['Trigger, Action, Result', 'Cue, Routine, Reward', 'Start, Process, Finish', 'Input, Output, Feedback'],
          correctAnswer: 1,
        },
        {
          question: 'Which brain structure is primarily responsible for automating habits?',
          options: ['Prefrontal cortex', 'Hippocampus', 'Basal ganglia', 'Amygdala'],
          correctAnswer: 2,
        },
        {
          question: 'According to Wood & Neal (2007), approximately what percentage of daily behaviors are habitual?',
          options: ['10%', '25%', '43%', '75%'],
          correctAnswer: 2,
        },
        {
          question: 'What is the "Golden Rule" of habit change according to Duhigg?',
          options: [
            'Eliminate the cue to eliminate the habit',
            'Replace the routine while keeping the cue and reward the same',
            'Focus only on willpower to overcome bad habits',
            'Remove all rewards to break the habit loop',
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    slug: '66-day-truth',
    title: 'The 66-Day Truth',
    subtitle: 'What science really says about how long habits take to form',
    category: 'productivity',
    orderIndex: 2,
    readTimeMin: 6,
    minPlanSlug: 'free',
    keyTakeaways: [
      'The popular "21 days to form a habit" claim has no scientific basis and comes from a misquoted plastic surgeon',
      'Lally et al. (2010) found that habits take an average of 66 days to become automatic, with a range of 18 to 254 days',
      'Automaticity follows an asymptotic curve: most gains happen early, then progress gradually levels off',
      'Missing a single day does not reset your progress or significantly affect long-term habit formation',
      'Complexity of the habit is the strongest predictor of how long automaticity takes to develop'
    ],
    body: `## The 21-Day Myth

"It takes 21 days to form a habit." This claim is everywhere: self-help books, productivity blogs, fitness programs. It's also wrong. The number traces back to Maxwell Maltz, a plastic surgeon who observed in 1960 that his patients took about 21 days to adjust to their new appearance. Somewhere along the way, "at least 21 days" became exactly 21 days, and a personal observation became universal law.

## What the Science Actually Shows

In 2010, Phillippa Lally and colleagues at University College London published the first rigorous study on habit formation time. They tracked 96 participants who chose a new eating, drinking, or exercise behavior and measured how long it took for the behavior to feel automatic.

The results were illuminating:
- **Average time to automaticity: 66 days**
- **Range: 18 to 254 days**
- Simple habits (drinking a glass of water at lunch) formed faster
- Complex habits (50 sit-ups before dinner) took much longer
- Individual variation was enormous

The 66-day average is helpful as a rough benchmark, but the range tells a more important story: there is no universal timeline. Your habit, your context, and your consistency determine the speed.

## The Automaticity Curve

Lally's data revealed that habit strength follows an asymptotic curve, not a linear progression. In practical terms, this means:

**Weeks 1-3**: The steepest gains. The behavior feels effortful but improves rapidly. This is where most people quit.

**Weeks 4-8**: The behavior becomes noticeably easier. You need less willpower. Missing a day doesn't feel catastrophic.

**Weeks 9+**: The curve flattens. The behavior is largely automatic. Gains are marginal but the habit is solidifying.

This curve explains why the first few weeks feel so hard: you're climbing the steepest part of the hill. It also explains why many people feel like habits "click" around the 6-8 week mark, even if they aren't fully automatic yet.

## The Streak Science

Modern habit-tracking apps have popularized the streak: an unbroken chain of daily completions. Streaks provide visible progress and social motivation, but they can also create fragile all-or-nothing thinking.

Lally's most reassuring finding was that **missing a single day did not significantly affect the long-term automaticity process**. The participants who occasionally missed a day reached similar levels of automaticity as those with perfect streaks. What mattered was overall consistency over weeks and months, not perfection on any given day.

This finding liberates us from streak anxiety. A habit tracker should be a tool for awareness, not a source of guilt. Missing one day is a data point, not a failure.

## What Predicts Habit Formation Speed?

Several factors influence how quickly a behavior becomes automatic:
- **Simplicity**: Simpler behaviors automate faster (drinking water vs. running 5K)
- **Consistency of context**: Same time, same place, same preceding action accelerates learning
- **Intrinsic motivation**: Behaviors you genuinely enjoy become habitual more easily
- **Frequency**: Daily behaviors automate faster than weekly ones
- **Individual differences**: Some people are neurologically faster habit-formers

## Practical Implications

Armed with this research, you can set realistic expectations:
- Plan for at least two months for a new habit to feel natural, not three weeks
- Front-load support and accountability during the critical first three weeks
- Don't panic about missed days; focus on returning to the behavior quickly
- Start with the simplest version of the habit you want to build
- Use your tracker to observe the curve: it should get easier over time

The 66-day truth is both harder and more forgiving than the 21-day myth. It takes longer than you hope, but it doesn't require perfection.`,
    quizData: {
      questions: [
        {
          question: 'Where did the popular "21 days to form a habit" claim originate?',
          options: [
            'A peer-reviewed psychology study',
            'An observation by plastic surgeon Maxwell Maltz about patient adjustment',
            'A Harvard University research program',
            'Ancient Greek philosophy',
          ],
          correctAnswer: 1,
        },
        {
          question: 'What was the average time to automaticity found in the Lally et al. (2010) study?',
          options: ['21 days', '30 days', '66 days', '90 days'],
          correctAnswer: 2,
        },
        {
          question: 'According to Lally\'s research, what happens when you miss a single day?',
          options: [
            'The habit resets completely',
            'You lose approximately one week of progress',
            'It does not significantly affect long-term automaticity',
            'The habit becomes twice as hard to maintain',
          ],
          correctAnswer: 2,
        },
        {
          question: 'What is the strongest predictor of how long a habit takes to form?',
          options: [
            'The person\'s age',
            'The complexity of the behavior',
            'Whether they use a habit tracker',
            'The time of day they practice',
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    slug: 'tiny-habits',
    title: 'Tiny Habits & If-Then Plans',
    subtitle: 'The behavioral science of making habits effortlessly small',
    category: 'wellness',
    orderIndex: 3,
    readTimeMin: 6,
    minPlanSlug: 'pro',
    keyTakeaways: [
      'BJ Fogg\'s Tiny Habits model shows that scaling down a behavior to its smallest version eliminates the motivation barrier',
      'Implementation intentions ("if X happens, then I will do Y") have a medium-to-large effect size (d=0.65) on goal achievement',
      'Habit stacking anchors new behaviors to existing habits, leveraging established neural pathways as triggers',
      'The key to starting a new habit is making it so small that it feels absurd not to do it',
      'Celebration immediately after completing the tiny behavior is critical for wiring the habit into your brain'
    ],
    body: `## The Problem With Motivation

Most habit advice starts with motivation: "Find your why," "Get inspired," "Visualize your goal." But motivation is volatile. It surges on Monday morning and evaporates by Wednesday afternoon. BJ Fogg, a Stanford behavior scientist, argued in his 2019 work that designing for motivation is designing for failure.

Instead, Fogg proposed a radical alternative: make the behavior so tiny that it requires virtually zero motivation to execute.

## The Tiny Habits Method

Fogg's formula is elegant: **After I [ANCHOR HABIT], I will [TINY BEHAVIOR].**

Examples:
- After I pour my morning coffee, I will write one sentence in my journal
- After I sit down at my desk, I will open my task list
- After I put on my running shoes, I will step outside the door

The key principles:
- The tiny behavior must take less than 30 seconds
- It must be anchored to an existing habit (something you already do reliably)
- You must celebrate immediately afterward (a fist pump, a smile, saying "yes!")

The celebration is not optional. Fogg's research shows that positive emotion is what wires the behavior into the brain. Without it, the neural pathway stays weak.

## Implementation Intentions

Parallel to Fogg's work, Peter Gollwitzer developed the concept of implementation intentions in the 1990s. A meta-analysis by Gollwitzer and Sheeran (2006) across 94 studies found a medium-to-large effect size (d=0.65) for this simple strategy.

An implementation intention is an "if-then" plan: **"If [SITUATION], then [BEHAVIOR]."**

Examples:
- If it's 7 AM, then I will meditate for one minute
- If I feel the urge to check social media, then I will take three deep breaths instead
- If I finish dinner, then I will walk around the block

The power of implementation intentions lies in pre-deciding. When the situation arises, you don't need to deliberate, negotiate with yourself, or summon willpower. The decision is already made. Your brain shifts from "should I?" to "here's what I do."

## Habit Stacking

James Clear popularized the concept of habit stacking, which merges Fogg's anchoring and Gollwitzer's implementation intentions into a practical system. The formula: **After [CURRENT HABIT], I will [NEW HABIT].**

The key is chaining:
- After I brush my teeth, I will do 5 pushups
- After I do 5 pushups, I will drink a glass of water
- After I drink water, I will review my goals for the day

Each completed habit becomes the cue for the next. Because the chain is anchored to a deeply established behavior (brushing teeth), the entire sequence benefits from the existing neural pathway.

## Why Small Beats Big

The instinct when starting a habit is to aim high: "I'll run 5K every morning," "I'll meditate for 30 minutes," "I'll read for an hour before bed." These goals feel inspiring on day one. By day five, they feel like burdens.

Fogg's insight is counterintuitive: **start absurdly small, then let the behavior grow naturally.** One push-up becomes five, becomes ten. One sentence becomes a paragraph. The person who does one push-up every day for a year has built a robust exercise habit. The person who attempts fifty push-ups on January 1st usually quits by January 15th.

The tiny behavior establishes the routine and the identity ("I'm someone who exercises"). Volume and intensity can scale later, but only after the habit loop is firmly established.

## Practical Application

To implement this today:
1. Choose one habit you want to build
2. Scale it down to its tiniest version (under 30 seconds)
3. Identify an existing habit to anchor it to
4. Write your implementation intention: "After I [anchor], I will [tiny behavior]"
5. Celebrate immediately after doing it
6. Repeat daily for at least two months before scaling up

The compound effect of tiny daily actions is staggering. Small, consistent behaviors outperform ambitious, inconsistent ones every time.`,
    quizData: {
      questions: [
        {
          question: 'What is the core formula of BJ Fogg\'s Tiny Habits method?',
          options: [
            'Set a goal, find motivation, execute daily',
            'After I [anchor habit], I will [tiny behavior]',
            'Track everything and analyze weekly',
            'Visualize the outcome, then work backward',
          ],
          correctAnswer: 1,
        },
        {
          question: 'What effect size did Gollwitzer & Sheeran (2006) find for implementation intentions?',
          options: ['Small (d=0.20)', 'Medium-to-large (d=0.65)', 'Very large (d=1.2)', 'No significant effect'],
          correctAnswer: 1,
        },
        {
          question: 'Why does BJ Fogg emphasize celebration immediately after the tiny behavior?',
          options: [
            'It makes other people notice your habit',
            'Positive emotion wires the behavior into the brain',
            'It increases the difficulty of the habit',
            'It is a form of accountability',
          ],
          correctAnswer: 1,
        },
        {
          question: 'What is the recommended duration for a "tiny behavior" before scaling up?',
          options: ['Under 30 seconds', '5 minutes', '15 minutes', '30 minutes'],
          correctAnswer: 0,
        },
      ],
    },
  },
  {
    slug: 'brain-on-habits',
    title: 'Your Brain on Habits',
    subtitle: 'Dopamine, identity, and the neuroscience of automatic behavior',
    category: 'learning',
    orderIndex: 4,
    readTimeMin: 6,
    minPlanSlug: 'pro',
    keyTakeaways: [
      'Dopamine drives habit formation through reward prediction: it spikes for unexpected rewards and eventually shifts to the cue itself',
      'As a habit becomes automatic, the prefrontal cortex disengages and the basal ganglia takes over, reducing cognitive load',
      'Identity-based habits (Clear 2018) are more durable because they change what you believe about yourself, not just what you do',
      'The brain physically changes structure in response to repeated habits, creating thicker neural pathways for automated behaviors',
      'Understanding the neurological basis of habits explains why willpower alone is insufficient for long-term behavior change'
    ],
    body: `## The Dopamine Discovery

In 1997, Wolfram Schultz published a landmark study that changed our understanding of motivation and learning. He found that dopamine, the neurotransmitter popularly (and inaccurately) called the "pleasure chemical," actually functions as a reward prediction signal.

Here's how it works with habits:
- **Unexpected reward**: Dopamine surges when you receive a reward you didn't anticipate. This is the "discovery" phase of a new positive behavior.
- **Expected reward**: As the behavior repeats, dopamine no longer fires at the reward itself. Instead, it fires at the cue that predicts the reward.
- **Missing reward**: If you encounter the cue but the expected reward doesn't come, dopamine drops below baseline, creating a negative feeling. This is why breaking a habit feels uncomfortable.

This shift from reward to cue is the neurological mechanism behind craving. Your brain doesn't wait for the reward; it starts wanting it the moment the trigger appears.

## The Prefrontal Cortex Handoff

When you first attempt a new behavior, your prefrontal cortex (PFC) is highly engaged. This is the part of your brain responsible for planning, decision-making, and impulse control. It takes effort. You feel the strain of choosing the new behavior over the comfortable default.

As the behavior repeats in consistent contexts, a remarkable transfer occurs. The basal ganglia, which handles procedural memory and automatic routines, gradually takes over. Neuroimaging studies show that PFC activity decreases as a habit strengthens.

This is why established habits feel effortless. The brain has literally delegated the behavior to a more efficient processing system. It's also why trying to "think your way out" of a bad habit doesn't work: the behavior isn't being run by the thinking part of your brain anymore.

## Identity-Based Habits

James Clear, in his 2018 framework, proposed that the most durable habits are rooted not in outcomes or processes but in identity. There are three layers of behavior change:

**Outcome-based**: "I want to lose 20 pounds" (what you want to achieve)
**Process-based**: "I will go to the gym three times a week" (what you plan to do)
**Identity-based**: "I am someone who moves their body daily" (who you believe you are)

Most people start with outcomes and try to work backward. Clear argues you should start with identity. When you believe you are a certain type of person, the behaviors that align with that identity become self-reinforcing. You don't need willpower to do something that feels like an expression of who you are.

Every time you complete a habit, you cast a vote for your desired identity. Each vote isn't decisive on its own, but over time, the evidence accumulates until the identity shift becomes real.

## Neuroplasticity and Habit Pathways

The brain is not fixed. Through a process called neuroplasticity, neural pathways that are frequently used become stronger and more efficient, while unused pathways weaken. This is the physical basis of the saying "neurons that fire together wire together."

When you repeat a habit:
- The myelin sheath around the relevant neural pathway thickens, increasing signal speed
- Synaptic connections strengthen, making the pathway more reliable
- Competing pathways (old habits) gradually weaken if unused

This is why consistency matters more than intensity. A daily 10-minute practice builds a thicker, faster neural pathway than a weekly 70-minute session, even though the total time is the same.

## Why Willpower Fails

Understanding the neuroscience explains why relying on willpower for habit change is a losing strategy. Willpower is a function of the prefrontal cortex, which has limited capacity. It fatigues throughout the day (a phenomenon called ego depletion, though debated in recent literature). Trying to use the PFC to override a behavior that the basal ganglia is running automatically is like trying to steer a car by pushing the dashboard instead of turning the wheel.

The effective approach is to work with your brain's habit machinery: design cues, engineer rewards, build identity, and let repetition do the heavy lifting of rewiring your neural circuits.`,
    quizData: {
      questions: [
        {
          question: 'According to Schultz (1997), when does dopamine fire once a habit is established?',
          options: [
            'Only when the reward is received',
            'At the cue that predicts the reward',
            'Continuously throughout the behavior',
            'Only when the habit is broken',
          ],
          correctAnswer: 1,
        },
        {
          question: 'What happens to prefrontal cortex activity as a habit becomes automatic?',
          options: [
            'It increases dramatically',
            'It stays the same',
            'It decreases as the basal ganglia takes over',
            'It shifts to the amygdala',
          ],
          correctAnswer: 2,
        },
        {
          question: 'What is the most durable layer of behavior change according to James Clear?',
          options: ['Outcome-based', 'Process-based', 'Identity-based', 'Reward-based'],
          correctAnswer: 2,
        },
        {
          question: 'Why does consistency matter more than intensity for building habits?',
          options: [
            'Because intense sessions are dangerous',
            'Because daily repetition builds thicker, faster neural pathways than infrequent practice',
            'Because the brain can only learn in short bursts',
            'Because habits only form in the morning',
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    slug: 'environment-design',
    title: 'Design Your Environment',
    subtitle: 'How context cues and choice architecture shape behavior',
    category: 'productivity',
    orderIndex: 5,
    readTimeMin: 6,
    minPlanSlug: 'pro',
    keyTakeaways: [
      'Wood and Neal (2007) showed that 43% of daily behavior is performed in the same location and driven by environmental cues rather than conscious decisions',
      'Choice architecture (nudge theory) demonstrates that the default option is the most powerful predictor of behavior',
      'Making desired behaviors visible, easy, and attractive while making undesired ones invisible, hard, and unattractive is the foundation of environment design',
      'Changing your environment is more sustainable than relying on willpower because it reduces the number of decisions you need to make',
      'Even small environmental changes (moving fruit to the counter, placing a book on the pillow) can produce outsized behavioral shifts'
    ],
    body: `## Your Environment Is Your First Choice

Every day you make hundreds of decisions you're not aware of. Whether you grab an apple or a cookie depends less on your willpower and more on which one is sitting on the counter. Whether you exercise after work depends less on your motivation and more on whether your gym bag is packed and visible by the door. This is the power of environment design.

## The 43% Revelation

Wood and Neal's influential 2007 research demonstrated a striking finding: approximately 43% of everyday behaviors are performed almost automatically in stable contexts. People eat the same breakfast in the same seat, take the same route to work, and reach for their phone in the same situations, not because they consciously choose to each time, but because the environmental cues trigger habitual responses.

This means nearly half of your daily life is shaped by the contexts you inhabit, not the goals you set.

## Choice Architecture and Nudge Theory

Richard Thaler and Cass Sunstein popularized the concept of "choice architecture," the idea that how options are presented influences which option people choose. The most powerful finding: **the default option wins almost every time.**

In cafeterias, placing healthy food at eye level increases consumption by 25%. In organ donation, countries that use opt-out (default yes) have donation rates above 90%, while opt-in countries hover around 15%. The behavior is the same; only the default changed.

You can apply this to your own habits by making the desired behavior the default:
- Want to read more? Put the book on your pillow so you must move it to go to sleep
- Want to drink more water? Fill a bottle and place it on your desk every morning
- Want to stop scrolling social media? Remove the app from your home screen and log out

## The Four Laws Applied to Environment

James Clear's framework offers a practical lens for environment design:

**Make it obvious (cue)**: Place visual triggers for good habits where you'll see them. Put your running shoes by the door. Set your journal on the breakfast table.

**Make it attractive (craving)**: Pair habits with things you enjoy. Listen to your favorite podcast only while exercising. Brew your best tea only during your study session.

**Make it easy (response)**: Reduce friction for good habits and increase it for bad ones. Pre-chop vegetables on Sunday so healthy cooking is frictionless. Unplug the TV after use so you must consciously decide to plug it back in.

**Make it satisfying (reward)**: Create immediate feedback. Use a habit tracker for the satisfaction of checking a box. Give yourself a small treat after a workout.

## The Power of Subtraction

Most advice focuses on adding: add a gym routine, add a meditation practice, add a journaling habit. But often the most impactful environmental change is subtraction, removing the triggers and friction that feed bad habits.

- Remove the candy bowl from the desk
- Unsubscribe from marketing emails that trigger impulse purchases
- Charge your phone in another room overnight
- Delete time-wasting apps rather than trying to resist opening them

Subtraction works because it eliminates the need for willpower entirely. You can't eat cookies that aren't in the house.

## Context-Dependent Behavior

Research consistently shows that habits are deeply tied to context. The same person who eats healthy at home may binge on junk food at the office because different environments activate different behavioral patterns.

This has two practical implications:
1. **New environments are opportunities**: Moving to a new apartment, starting a new job, or traveling can be optimal times to install new habits because old cues are absent
2. **Separate spaces for separate behaviors**: If possible, designate specific areas for specific activities. Work at the desk, relax on the couch, sleep in the bed. When spaces serve only one purpose, the environmental cue becomes stronger.

## Designing Your Space Today

Start with one room and one habit. Ask yourself: What can I make visible that will cue the behavior I want? What can I remove that triggers the behavior I want to avoid? What can I rearrange to make the good behavior the path of least resistance?

Small changes to your environment compound into large changes in your behavior, without requiring more discipline or motivation.`,
    quizData: {
      questions: [
        {
          question: 'According to Wood and Neal (2007), what percentage of daily behavior is habitual and context-driven?',
          options: ['15%', '25%', '43%', '60%'],
          correctAnswer: 2,
        },
        {
          question: 'What is the most powerful predictor of behavior according to nudge theory?',
          options: ['Personal motivation', 'The default option', 'Social pressure', 'Financial incentives'],
          correctAnswer: 1,
        },
        {
          question: 'Which environmental design strategy involves removing triggers for bad habits?',
          options: ['Addition', 'Subtraction', 'Multiplication', 'Substitution'],
          correctAnswer: 1,
        },
        {
          question: 'Why are new environments (new job, new home) good opportunities for habit change?',
          options: [
            'Because new environments are always better',
            'Because old cues are absent, making it easier to install new habits',
            'Because stress from change motivates people',
            'Because people have more free time during transitions',
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    slug: 'social-recovery',
    title: 'Social Accountability & Recovery',
    subtitle: 'Leveraging relationships and bouncing back from lapses',
    category: 'wellness',
    orderIndex: 6,
    readTimeMin: 6,
    minPlanSlug: 'pro',
    keyTakeaways: [
      'Self-Determination Theory (Deci & Ryan 2000) identifies relatedness as one of three core psychological needs that drive sustainable behavior',
      'Having an accountability partner increases the probability of completing a goal by approximately 50%',
      'The "never miss twice" rule is more sustainable than the "never miss" rule, because it accepts human imperfection while maintaining momentum',
      'Relapse prevention research shows that how you respond to a lapse matters more than whether the lapse occurs',
      'Social support works best when it provides autonomy support (encouraging self-direction) rather than controlling pressure'
    ],
    body: `## The Social Dimension of Habits

Habits are often framed as personal battles: you versus your willpower, your discipline, your alarm clock. But decades of behavioral research show that the social dimension of habit formation is at least as important as individual strategies. Humans are fundamentally social creatures, and our behaviors are profoundly shaped by the people around us.

## Self-Determination Theory

Edward Deci and Richard Ryan's Self-Determination Theory (SDT), refined over decades and formalized in their 2000 review, identifies three innate psychological needs that drive human motivation:

**Autonomy**: The need to feel in control of your own behavior and choices
**Competence**: The need to feel effective and capable of mastering challenges
**Relatedness**: The need to feel connected to others and experience belonging

When all three needs are met, motivation becomes intrinsic, meaning you do the behavior because it is personally meaningful, not because of external pressure. For habits, this means that the most sustainable behaviors are those that make you feel autonomous, competent, and socially connected.

## The Accountability Effect

Research on goal achievement consistently shows that social accountability dramatically increases follow-through. Studies by the American Society of Training and Development found that:
- Having a specific goal gives you a 25% chance of completing it
- Committing to someone else increases the chance to 65%
- Having a specific accountability appointment boosts it to 95%

While the exact percentages vary across studies, the pattern is consistent: when someone else knows about your goal and checks in on your progress, you are significantly more likely to follow through. The mechanism involves both positive motivation (wanting to share success) and loss aversion (not wanting to admit failure).

## What Makes Accountability Work

Not all accountability is created equal. Research suggests that effective accountability:
- **Supports autonomy**: The partner encourages rather than controls. "How did your run go?" is better than "Did you run? You said you would."
- **Is consistent**: Regular check-ins (daily or weekly) work better than sporadic ones
- **Is reciprocal**: Mutual accountability (where both partners have goals) creates shared investment
- **Focuses on effort, not outcomes**: "I see you showed up even when it was hard" reinforces the process, not just results

Controlling or judgmental accountability backfires. When people feel pressured or shamed, their intrinsic motivation decreases and they're more likely to abandon the habit entirely.

## The "Never Miss Twice" Rule

Perfection is the enemy of habit formation. The person who demands a perfect streak sets themselves up for catastrophic failure: one missed day triggers guilt, which triggers avoidance, which triggers a complete relapse.

The "never miss twice" rule provides a more resilient framework:
- Missing one day is normal and expected
- The critical moment is what you do the day after a miss
- Returning to the behavior immediately prevents the miss from becoming a pattern
- The habit of recovering is itself a habit worth building

This approach aligns with relapse prevention research from addiction science, which shows that the critical factor in long-term behavior change is not avoiding all lapses but having a plan for how to respond when they inevitably occur.

## Relapse Prevention for Habits

Marlatt and Gordon's relapse prevention model, originally developed for addiction, applies broadly to any behavior change:

**The Abstinence Violation Effect (AVE)**: When someone breaks their streak, they often experience a cascade of negative thoughts: "I blew it," "I have no discipline," "What's the point?" This cognitive response, not the lapse itself, is what causes full relapse.

**The antidote**: Treat lapses as data, not disasters. Ask: What triggered the lapse? What can I adjust? Then immediately return to the behavior. Self-compassion research shows that people who treat themselves kindly after a setback recover faster than those who are self-critical.

## Building Your Support System

Practical steps to leverage social accountability:
- Find one person to share your habit goal with and schedule weekly check-ins
- Join a community (online or in-person) of people working on similar habits
- Use apps that provide social features: shared streaks, challenges, or progress boards
- Celebrate wins together: shared success strengthens both the habit and the relationship
- Practice the "never miss twice" rule: when you miss a day, make returning the very next day your primary goal

The most durable habits are embedded in social contexts that support autonomy, provide encouragement, and normalize imperfection. You don't build great habits alone; you build them in community.`,
    quizData: {
      questions: [
        {
          question: 'What are the three core needs in Self-Determination Theory (Deci & Ryan)?',
          options: [
            'Power, Achievement, Affiliation',
            'Autonomy, Competence, Relatedness',
            'Safety, Belonging, Esteem',
            'Motivation, Discipline, Consistency',
          ],
          correctAnswer: 1,
        },
        {
          question: 'By approximately how much does having an accountability partner increase goal completion?',
          options: ['10%', '25%', '50%', '90%'],
          correctAnswer: 2,
        },
        {
          question: 'What is the "never miss twice" rule?',
          options: [
            'Never miss more than two days per week',
            'If you miss one day, the critical action is returning immediately the next day',
            'Always do the habit twice per day to compensate for potential misses',
            'Set two alarms so you never miss',
          ],
          correctAnswer: 1,
        },
        {
          question: 'According to relapse prevention research, what causes full relapse after a lapse?',
          options: [
            'The chemical changes from the lapse itself',
            'The Abstinence Violation Effect: negative self-talk and all-or-nothing thinking after the lapse',
            'The loss of physical conditioning',
            'The lack of a habit tracker',
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
]

async function main() {
  console.log('Seeding HabitOS Academy chapters...')

  for (const ch of chapters) {
    await prisma.academyChapter.upsert({
      where: { slug: ch.slug },
      update: {
        title: ch.title,
        subtitle: ch.subtitle,
        body: ch.body,
        category: ch.category,
        orderIndex: ch.orderIndex,
        readTimeMin: ch.readTimeMin,
        keyTakeaways: ch.keyTakeaways,
        minPlanSlug: ch.minPlanSlug,
        quizData: ch.quizData,
        isActive: true,
      },
      create: ch,
    })
    console.log(`  Upserted: ${ch.slug}`)
  }

  // Seed AIConfig for academy_chapter
  await prisma.aIConfig.upsert({
    where: { contentType: 'academy_chapter' },
    update: {},
    create: {
      contentType: 'academy_chapter',
      model: 'gpt-4o-mini',
      temperature: 0.8,
      maxTokens: 4000,
      systemPrompt: 'You are a behavioral science educator and habit formation expert. Create engaging, evidence-based educational content about habits, behavior change, and personal development. Include research citations where appropriate. Return ONLY valid JSON.',
      isActive: true,
    },
  })
  console.log('  Upserted AIConfig: academy_chapter')

  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
