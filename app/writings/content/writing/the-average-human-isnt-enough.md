---
title: The Average Human Isn't Enough
subtitle: On silicon sampling, and the one thing we keep forgetting to measure.
date: 14 August 2026
---

Last week I read a paper titled MatrAIx that simulates a world of 8.3 billion AI agents (roughly one persona for every human alive) and uses them to test products and studies on a "population" meant to be as diverse as the real world. It's interesting, ambitious work, and it sent me straight back to my undergrad thesis I wrote last year, which centered around one question: 

*What would actually make a population of AI simulated humans scientifically interesting?*

The field has been on a tear. A handful of companies - Aaru, Simile, Artificial Societies - have raised serious money to build these kinds of simulations. To be clear, I don't want any of them to catch strays here (if anything, I'm rooting for them!) I just want to point at the thing I think matters most, in the hope it's useful to whoever's building what's next.

Almost everyone working on this is asking the same question: Do the AI agents reproduce the behaviour we expect from humans? That's a reasonable question. But it skips a second one that I think matters just as much: Do they disagree the way real people do too?

## The easy part

The appeal of silicon sampling is obvious. Agents are fast, cheap, and behaviourally rich. If we condition one on a specific sociodemographic profile it can reproduce a startling amount of humanlike decision-making, documented biases and all. Suddenly we can model how a policy lands across subgroups, watch population-level dynamics unfold, and test treatment effects, all without recruiting, scheduling, paying, or debriefing a single person. This is all very exciting for questions that are too slow, too expensive, or too ethically fraught to run on real humans.

But behavioural research was never only about averages. It's also about variation. In the real world people disagree about what's fair, what others deserve, and how much they'll personally give up for their principles. If AI agents are going to stand in for human participants, they have to reproduce not just the centre of the distribution but its whole shape - the spread, the tails, the lumps.

## Three bars, and the one nobody's standing on

In my thesis I argued that for AI agents to be genuinely useful research tools, they need to clear three bars:
1. **Representational accuracy**: they produce results that line up with established human patterns.
2. **Behavioural variability**: they show the same messy heterogeneity you'd find in a real population.
3. **Ecological validity**: they interact with one another in ways that resemble real social dynamics.

Most of the field lives on the first bar: show that a conditioned agent gives roughly the "right" answer. A newer strand is climbing the third bar - whole simulated societies of agents talking to each other, MatrAIx among them. The second bar is the one almost nobody's standing on, and I think it's the one that decides whether any of this research actually produces new knowledge. Without real heterogeneity, we can't tell whether these agents are just handing back the average human answer they absorbed in training. And an agent that only ever returns the textbook result is not really more interesting than looking at a spreadsheet.

## Sometimes the tail is the whole story

Here's the objection I always get. *Why should we care about the shape of the responses if the expected value is already correct for the group we care about?* 

The answer is that for a lot of the most interesting problems, the average tells you almost nothing and the shape tells you everything.

Take Granovetter's threshold models of collective behaviour. Whether a tense crowd tips into a riot doesn't depend on the average person's willingness to join. It depends on the distribution of individual thresholds: how many others each person needs to see act first before they'll go too. Two crowds with an identical average threshold can do opposite things. One erupts while the other stays calm... the only difference is whether the distribution has an unbroken chain of low-threshold instigators or a gap in the tail that quietly kills the cascade. The mean is silent on all of this. A few people in the low tail decide the entire outcome. The same logic drives revolutions, bank runs, protest movements, and the way new products catch on.

Or take social mobility. The questions people actually care about are tail questions: what are the odds a kid born in the bottom percent of the income distribution makes it to the top (the "rags to riches" story) and how sticky are the ends? How many born at the bottom stay there; how many at the top never fall? Average mobility is nearly useless here, because two societies can post the same average rate while offering wildly different escape hatches out of poverty. A simulated population that nails the expected value but flattens the tails will get all of these questions wrong.

## What happened when I tried it

Three things stuck with me from my own work:

**First, AI agents are too nice**. Across a range of dictator games, my AI agents were consistently more generous, fairer, and kinder than real people. My hypothesis is that this is a fingerprint of AI alignment work. These models are fine-tuned in post-training to lean into the traits we've decided are desirable - benevolence, fairness, helpfulness - and that shows up as agents who are nicer than humans actually are. 

**Second, they're hard to interrogate**. When a human does something surprising you can go back to that person, ask about their upbringing, their mood, their reasoning, and slowly build a richer picture of why they answered the way they did. AI agents are epistemically opaque in a way that shuts that door. You see the choice, but there's no life behind it to dig into. 

**And lastly, AI agents get less useful as AI models get "better."** As AI models advance, their answers get more accurate and less diverse. The progress we make that makes AI more reliable narrows the spread of their responses, which makes the rich, revealing distributions we care about harder to elicit. "More advanced" and "more humanlike" are pulling in opposite directions.

## What I'd love to see

None of this is a knock on the field. I think silicon sampling is one of the most promising things happening in social science, and I want it to work. But if it's going to deliver on the promise, we have to treat humanlike variance as a first-class target rather than an afterthought. That means testing more than one model family, designing experiments that actually try to elicit heterogeneity instead of assuming it's there, and maybe eventually building agents tuned for behavioural research rather than borrowed from chatbots optimised to be agreeable.

The average was always the easy part. The interesting stuff, like the riots that do or don't happen, or the kids who do or don't escape from poverty, has always lived in the tails. If we want AI crowds to teach us something new about real ones, we have to make sure they can still surprise us.
