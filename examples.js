/**
 * Caramel Latte — worked examples, sophisticated lexicon, and classifiers.
 * Loaded before the main app script in index.html.
 */
(function (global) {
    'use strict';

    // --- NAPLAN-style “sophisticated” signals (estimate; markers use professional judgment) ---
    // Tier-2 / academic-ish vocabulary (subset). Distinct words in the draft that appear here count.
    const SOPHISTICATED_LEXICON = new Set(
        `abandon ability abstract academic acknowledge acquire adapt adequate adjust advocate affect analyse analyze anticipate apparent appreciate approach appropriate approximate area aspect assemble assess assign assist assume authority automatic available aware benefit bias brief bulk capable capacity category challenge chapter circumstance cite civil clarify code coherent coincide commence comment commission community compatible compile complex component comprise compute conceive concentrate concept conclude concurrent confer confirm consequent consist constant constitute constrain construct consult context contract contribute converse convince cooperate coordinate corporate correspond criteria criterion data debate decline define demonstrate denote deny depress derive design despite detect deviate devise devote dimension diminish discrete discriminate display distinct distort distribute domestic dominate draft duration dynamic economy element emerge emphasis empirical enable encounter energy enforce enhance enormous entity environment equate equivalent erode error establish ethic ethnic eventual evident evolve exceed exclude exhibit expand expert explicit exploit export external extract facilitate factor feature final finance finite flexible focus format found framework function fund furthermore gender generate generation globe grant guarantee guideline hence hierarchy highlight hypothesis identical ideology illustrate immigrate imply impose incentive incidence incline incorporate index indicate individual inevitable infer infrastructure inherent inhibit initial initiate injure innovate input insert insight integral integrate internal interpret interval intervene intrinsic invest investigate isolate issue justify layer lecture legal legislate levy liberal license logic maintain major mature mediate medium military minimal minimize monitor motive mutual negate network neutral nevertheless norm notion nuclear objective obtain occupy occur odd offset ongoing option orient outcome overlap overseas panel paradigm parallel participate passive perceive period persist perspective phase phenomenon plus policy portion pose positive potential precede precise predict predominant preliminary presume previous primary prime principle prior priority proceed process professional project promote proportion prospect protocol psychology purchase pursue random range ratio rational recover refine regime region register regulate reinforce reject relax release relevant reluctant require research reside resolve resource respond restore restrain restrict retain reveal revenue revise revolution rigid route scenario schedule scheme section sector secure seek select sequence session shift significant simulate sole somewhat source specific sphere stable statistic status stress structure style submit subsequent substitute succeed successive sufficient sum summary supplement survey survive suspend sustain symbol task team technical technique technology temporary tense terminate theme theory thereby thesis topic trace tradition transform transit transmit trend trigger ultimate undergo underlie undertake uniform unify unique universe unprecedented update utility valid vary vehicle version via violate virtual visible vision voluntary welfare whereas widespread`.split(/\s+/)
    );

    // Long / common words that are not “sophisticated” for scoring purposes
    const SOPHISTICATED_EXCLUDE = new Set(
        `something anything everything nothing somewhere anywhere everywhere sometimes somewhere somehow someone anyone everyone anybody everybody although because though unless whether another other such same rather pretty already still often usually always never seldom rarely though although everything somewhere`.split(/\s+/)
    );

    function buildWeakTokenSetFromLists(baseLists, analyticalLists, glueList) {
        const s = new Set();
        (glueList.words || []).forEach((w) => s.add(w.toLowerCase()));
        baseLists.forEach((l) => (l.words || []).forEach((w) => s.add(w.toLowerCase())));
        (analyticalLists || []).forEach((l) => (l.words || []).forEach((w) => s.add(w.toLowerCase())));
        return s;
    }

    /** String = senior-only legacy; { senior, junior } = both levels */
    function pickPerWord(entry, level) {
        if (entry == null) return null;
        if (typeof entry === 'string') return level === 'senior' ? entry : null;
        if (typeof entry === 'object') {
            if (level === 'junior') return entry.junior != null ? entry.junior : entry.senior;
            return entry.senior != null ? entry.senior : entry.junior;
        }
        return null;
    }

    const JUNIOR_GENERIC = {
        filler: `JUNIOR WORKED EXAMPLE\n\nDraft: "It was very good."\n\nRevision: "The pizza was hot and the cheese stretched when I lifted a slice."\n\nTeaching point: delete "very" and name one thing you can see, taste, or hear.`,
        filter: `JUNIOR WORKED EXAMPLE\n\nDraft: "I feel like the story is happy."\n\nRevision: "The story shows smiling people and bright colours in every scene."\n\nTeaching point: skip "I feel" and show what a viewer would actually notice.`,
        modal: `JUNIOR WORKED EXAMPLE\n\nDraft: "It might rain."\n\nRevision: "The sky is grey and the forecast says rain after lunch."\n\nTeaching point: say who, what, and when in simple words.`,
        cliche: `JUNIOR WORKED EXAMPLE\n\nDraft: "The test was a piece of cake."\n\nRevision: "The test only asked for definitions I had already memorised."\n\nTeaching point: swap the old saying for one honest detail from your experience.`,
        subjective: `JUNIOR WORKED EXAMPLE\n\nDraft: "I think the writer is biased."\n\nRevision: "The writer only quotes one side of the debate, so the argument feels one-sided."\n\nTeaching point: point to the evidence instead of starting with "I think" in formal analysis.`,
        default: `JUNIOR WORKED EXAMPLE\n\nDraft: "It was bad."\n\nRevision: "The bridge shook in the wind and the wood was cracked."\n\nTeaching point: show what happened—then the reader understands without a vague label.`
    };

    function countSophisticatedDistinct(tokens, weakTokenSet) {
        const seen = new Set();
        let n = 0;
        for (const raw of tokens) {
            let w = raw.toLowerCase().replace(/['’]s$/i, '');
            if (w.length < 4) continue;
            if (weakTokenSet.has(w)) continue;
            if (SOPHISTICATED_EXCLUDE.has(w)) continue;
            if (seen.has(w)) continue;
            let qualifies = false;
            if (SOPHISTICATED_LEXICON.has(w)) qualifies = true;
            else if (w.length >= 9) qualifies = true;
            else if (w.length >= 8 && !/^(some|many|every|noth|anoth|again|throu|becau|witho|befor|after|there|where|these|those|would|could|should|people|person|school|student|teacher|another|children|parents)/.test(w)) qualifies = true;
            if (qualifies) {
                seen.add(w);
                n++;
            }
        }
        return n;
    }

    // --- Glue classification (every glue token maps to a template family) ---
    function classifyGlue(w) {
        const x = w.toLowerCase();
        if (/^(a|an|the)$/.test(x)) return 'article';
        if (/^(i|me|my|mine|you|your|yours|he|him|his|she|her|hers|it|its|we|us|our|ours|they|them|their|theirs)$/.test(x)) return 'pronoun';
        if (/^(and|but|or|nor|so|yet|if|because|since|unless|although|though|while|whilst)$/.test(x)) return 'conj';
        if (/^(of|in|on|at|by|with|from|to|about|into|onto|upon|out|over|under|above|below|behind|beside|beyond|during|through|throughout|toward|towards|within|without|up|down|off|near|after|before|until|till|once|like|as|than)$/.test(x)) return 'prep';
        if (/^(this|that|these|those|which|who|whom|whose|what|whatever|whoever|whomever|whichever|wherever|whenever|however)$/.test(x)) return 'wh';
        if (/^(each|every|many|much|some|any|no|not|all|none|few|several|most|other|another|such|same|own|both|neither|either|whether)$/.test(x)) return 'quant';
        if (/^(anything|everything|something|nothing|anyone|everyone|someone|no one|anybody|everybody|somebody|nobody|anywhere|everywhere|somewhere|nowhere)$/.test(x)) return 'indef';
        if (/^(also|only|enough|always|never|sometimes|often|usually|seldom|rarely|soon|already|still|even|next|last|first|second|third|final|finally|almost|else|instead|anyway)$/.test(x)) return 'advglue';
        if (/^(here|there|then|now|back|front|top|bottom|side)$/.test(x)) return 'place';
        if (/^(yes|yeah|ok|okay|oh|ah|well|wow|away)$/.test(x)) return 'discourse';
        return 'general';
    }

    const GLUE_TEMPLATES = {
        article: `WORKED EXAMPLE (articles)\n\nDraft: "The boy went to the shop. The shop was near the school."\n\nRevision: "At the corner store, he bought a drink, then cut through the oval."\n\nTeaching point: merge beats; don’t repeat "the" every clause.`,

        pronoun: `WORKED EXAMPLE (pronouns)\n\nDraft: "She saw it and she told him and he said no."\n\nRevision: "Ms Patel slid the memo across the desk. Marcus read it, throat tight."\n\nTeaching point: name actors when readers could lose he/she/it.`,

        conj: `WORKED EXAMPLE (conjunctions)\n\nDraft: "I was tired and I stayed up and I finished the essay because it was due."\n\nRevision: "I was exhausted, yet I stayed up—the essay was due by 8:00."\n\nTeaching point: vary links (because, yet, colon) instead of chaining "and".`,

        prep: `WORKED EXAMPLE (prepositions)\n\nDraft: "He walked to the door and put his hand on the wood and waited in the hall."\n\nRevision: "He stopped at the door, palm on cool wood, listening in the stairwell."\n\nTeaching point: batch place detail; one strong image per beat.`,

        wh: `WORKED EXAMPLE (wh-words)\n\nDraft: "There was a problem which was serious which meant we had to act."\n\nRevision: "A serious fault ran through the data: we had to act within the week."\n\nTeaching point: lead with the main claim; trim stacked relatives.`,

        quant: `WORKED EXAMPLE (quantifiers)\n\nDraft: "Many people think many problems are bad."\n\nRevision: "In our 2023 survey, 62% of Year 9s reported weekly stress peaks."\n\nTeaching point: swap vague "many/most" for numbers or scope when you can.`,

        indef: `WORKED EXAMPLE (indefinites)\n\nDraft: "Everyone felt something about the announcement, but nobody said anything."\n\nRevision: "A few teachers nodded; others studied the floor. Silence—not agreement."\n\nTeaching point: name a group or one concrete detail.`,

        advglue: `WORKED EXAMPLE (sentence adverbs)\n\nDraft: "Also, the results were bad. Finally, we concluded."\n\nRevision: "The results were grim—mean scores slid four points. We concluded vocabulary work needed resequencing."\n\nTeaching point: move transitions into the logic; cut meta openers when order is clear.`,

        /** Same glue family as advglue, but when the word is not at the start of a sentence (e.g. "with enough bullets"). */
        advglue_mid: `WORKED EXAMPLE (mid-sentence adverbs)\n\nDraft: "He loaded the gun with enough bullets, and it looked like he meant it."\n\nRevision: "He packed the magazine until the brass showed—enough to mean it."\n\nTeaching point: mid-line, cut adverbs that don’t earn their syllables.`,

        place: `WORKED EXAMPLE (place/time)\n\nDraft: "There were many people there and then there was noise."\n\nRevision: "The hall packed fast—chairs scraping—until the mic squealed."\n\nTeaching point: replace empty "there" with a concrete subject.`,

        discourse: `WORKED EXAMPLE (discourse markers)\n\nDraft: "Well, I guess, okay, I will try."\n\nRevision: "I will revise the introduction tonight and upload by 7:00."\n\nTeaching point: drop hedging fillers in formal writing.`,

        general: `WORKED EXAMPLE (glue)\n\nDraft: "It was a situation with a lot of things happening and there was no way to fix it."\n\nRevision: "Notifications stacked; the server lagged; every fix spawned a new fault line."\n\nTeaching point: when glue clusters, tighten nouns and merge sentences.`
    };

    const GLUE_TEMPLATES_JUNIOR = {
        article: `JUNIOR WORKED EXAMPLE (glue: a / an / the)\n\nDraft: "The boy went to the shop. The shop was near the school."\n\nRevision: "At the corner shop he bought a drink, then walked home past the oval."\n\nTeaching point: you still need some "the" and "a"—just don’t start every sentence the same way.`,
        pronoun: `JUNIOR WORKED EXAMPLE (glue: I / he / she / they)\n\nDraft: "She saw it and she told him and he said no."\n\nRevision: "Ms Patel slid the note across the desk. Marcus read it and said no."\n\nTeaching point: use names when readers might get lost in he/she/it.`,
        conj: `JUNIOR WORKED EXAMPLE (glue: and / but / because)\n\nDraft: "I was tired and I stayed up and I finished it because it was due."\n\nRevision: "I was tired, but I stayed up because the essay was due at 8:00."\n\nTeaching point: one strong link beats three weak "ands".`,
        prep: `JUNIOR WORKED EXAMPLE (glue: in / on / to / with)\n\nDraft: "He walked to the door and put his hand on the wood and waited in the hall."\n\nRevision: "He stopped at the door, hand on cool wood, listening in the hall."\n\nTeaching point: bunch place details into one clear picture.`,
        wh: `JUNIOR WORKED EXAMPLE (glue: which / who / that)\n\nDraft: "There was a problem which was serious."\n\nRevision: "A serious problem: we had to act this week."\n\nTeaching point: say the main point first, then add detail.`,
        quant: `JUNIOR WORKED EXAMPLE (glue: some / many / most)\n\nDraft: "Many people think it is bad."\n\nRevision: "In our class survey, 18 out of 24 students said the rule felt unfair."\n\nTeaching point: swap "many" for a number or a small group you can name.`,
        indef: `JUNIOR WORKED EXAMPLE (glue: everyone / something)\n\nDraft: "Everyone felt something but nobody spoke."\n\nRevision: "Some kids nodded; others stared at the floor. Nobody spoke."\n\nTeaching point: name a smaller group or one clear detail.`,
        advglue: `JUNIOR WORKED EXAMPLE (glue: also / finally / still)\n\nDraft: "Also, the results were bad. Finally, we stopped."\n\nRevision: "The results were bad. We stopped when the bell went."\n\nTeaching point: cut filler openers when the order is already clear.`,
        advglue_mid: `JUNIOR WORKED EXAMPLE (glue mid-sentence: enough / only / even)\n\nDraft: "He put in enough bullets and it looked scary."\n\nRevision: "He packed the magazine full—brass glinting."\n\nTeaching point: mid-line, "enough" can be cut or swapped for a sharper picture—say how many or what it looked like.`,
        place: `JUNIOR WORKED EXAMPLE (glue: here / there / then)\n\nDraft: "There were people there and then there was noise."\n\nRevision: "The hall filled fast. Then the mic squealed."\n\nTeaching point: start with what is actually doing the action.`,
        discourse: `JUNIOR WORKED EXAMPLE (glue: well / okay)\n\nDraft: "Well, okay, I will try."\n\nRevision: "I will try the draft again tonight."\n\nTeaching point: in school essays, cut oral fillers and say the plan.`,
        general: `JUNIOR WORKED EXAMPLE (glue words)\n\nDraft: "It was a thing with stuff happening."\n\nRevision: "Phones buzzed, the Wi‑Fi dropped, and the chat blew up."\n\nTeaching point: name real nouns—thing/stuff hide the action.`
    };

    // --- Weak verb classification: map every known weak verb token to a template bucket ---
    const WEAK_VERB_TO_GROUP = (function () {
        const m = {};
        const add = (arr, g) => arr.forEach((w) => (m[w] = g));
        add(['am', 'is', 'are', 'was', 'were', 'be', 'being', 'been'], 'copula');
        add(['have', 'has', 'had', 'having'], 'have');
        add(['do', 'does', 'did', 'doing', 'done'], 'do');
        add(['get', 'gets', 'got', 'getting', 'gotten'], 'get');
        add(['go', 'goes', 'going', 'went', 'gone'], 'go');
        add(['make', 'makes', 'making', 'made'], 'make');
        add(['take', 'takes', 'taking', 'took', 'taken'], 'take');
        add(['come', 'comes', 'coming', 'came'], 'come');
        add(['put', 'puts', 'putting'], 'put');
        add(['seem', 'seems', 'seemed', 'seeming', 'look', 'looks', 'looked', 'looking', 'appear', 'appears', 'appeared', 'appearing'], 'seem');
        add(['find', 'finds', 'found', 'finding'], 'find');
        add(['want', 'wants', 'wanted', 'wanting', 'need', 'needs', 'needed', 'needing'], 'want');
        add(['use', 'uses', 'used', 'using', 'try', 'tries', 'tried', 'trying'], 'use');
        add(['let', 'lets', 'letting', 'keep', 'keeps', 'kept', 'keeping', 'help', 'helps', 'helped', 'helping', 'show', 'shows', 'showed', 'showing'], 'help');
        add(
            [
                "didn't", "don't", "doesn't", "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't", "hadn't", "can't", "cannot", "won't", "wouldn't", "couldn't", "shouldn't", "ain't",
                "i'm", "you're", "he's", "she's", "it's", "we're", "they're", "i've", "you've", "we've", "they've", "i'd", "you'd", "he'd", "she'd", "we'd", "they'd", "that's", "there's", "what's", "who's", "where's", "how's"
            ],
            'contraction'
        );
        return m;
    })();

    function classifyWeakVerb(w) {
        const x = w.toLowerCase();
        return WEAK_VERB_TO_GROUP[x] || 'utility';
    }

    const WEAK_VERB_TEMPLATES = {
        copula: `WORKED EXAMPLE (be-verbs)\n\nDraft: "The forest was dark and the path was muddy and I was scared."\n\nRevision: "Dark trees closed around the path. Mud sucked at my boots."\n\nTeaching point: swap some copulas for action or sense; keep "was" where it earns.`,

        have: `WORKED EXAMPLE (have / has / had)\n\nDraft: "I had a problem and I had to finish the work."\n\nRevision: "I still owed two paragraphs—so I locked my phone and reopened the document."\n\nTeaching point: replace "had to" with owed, needed, faced, rewrote.`,

        do: `WORKED EXAMPLE (do / does / did)\n\nDraft: "I did the task and I did it quickly."\n\nRevision: "I rewrote the intro, stitched two quotes to the claim, trimmed repetition in body 2."\n\nTeaching point: name real steps: drafted, edited, cited.`,

        get: `WORKED EXAMPLE (get / got)\n\nDraft: "He got angry and got an idea and got out."\n\nRevision: "Anger flared. An idea struck: leave now. He bolted for the stairwell."\n\nTeaching point: replace "get" with became, had, left—whatever you mean.`,

        go: `WORKED EXAMPLE (go / went)\n\nDraft: "We went to the coast and we went home late."\n\nRevision: "We drove to the coast, windows down—then crawled home after midnight."\n\nTeaching point: specify how you moved: drove, hiked, fled.`,

        make: `WORKED EXAMPLE (make / made)\n\nDraft: "She made a decision and it made her nervous."\n\nRevision: "She chose the harder option—scholarship over comfort—and her stomach tightened as she hit send."\n\nTeaching point: chose / committed / refused beats "made a decision".`,

        take: `WORKED EXAMPLE (take / took)\n\nDraft: "He took the book and took a breath and took control."\n\nRevision: "He snatched the book, drew one breath, squared his shoulders to the room."\n\nTeaching point: grabbed, lifted, seized—what the scene actually does.`,

        come: `WORKED EXAMPLE (come / came)\n\nDraft: "He came into the room and came over to me."\n\nRevision: "He shouldered through the door, crossed in three strides, stopped close enough to smell rain on his jacket."\n\nTeaching point: show entry with motion and space.`,

        put: `WORKED EXAMPLE (put)\n\nDraft: "He put the bag down and put his hand on the table."\n\nRevision: "He dropped the bag and flattened his palm to the laminate."\n\nTeaching point: slammed, set, slid—precision beats "put" twice.`,

        seem: `WORKED EXAMPLE (seem / look / appear)\n\nDraft: "He seemed angry and it looked bad."\n\nRevision: "His jaw worked; a vein ticked. The report card trembled between two fingers."\n\nTeaching point: show cues; anchor "seemed" in evidence.`,

        find: `WORKED EXAMPLE (find / found)\n\nDraft: "I found that the answer was simple."\n\nRevision: "After re-reading the footnote, the pattern clarified: the spike was the outlier school."\n\nTeaching point: show the step: re-read, compared, noticed.`,

        want: `WORKED EXAMPLE (want / need)\n\nDraft: "I wanted to leave and I needed air."\n\nRevision: "My ribs tightened; the room smelled like toner. I pushed into the corridor."\n\nTeaching point: dramatize pressure—then the want lands.`,

        use: `WORKED EXAMPLE (use / try)\n\nDraft: "I tried to write and I used a plan."\n\nRevision: "I sketched three claims, dropped evidence under each, then fixed the weakest paragraph."\n\nTeaching point: replace "tried" with the sequence you did.`,

        help: `WORKED EXAMPLE (let / help / show)\n\nDraft: "Let me explain and I will help you."\n\nRevision: "Here’s the fix: actors in the subject line, one quote per paragraph."\n\nTeaching point: deliver the fix; skip meta about helping.`,

        contraction: `WORKED EXAMPLE (contractions)\n\nDraft: "It’s clear that we’re going to fail if we don’t start."\n\nRevision: "It is clear that we will fail if we do not begin tonight."\n\nTeaching point: full forms read more formal—match register to task.`,

        utility: `WORKED EXAMPLE (utility verbs)\n\nDraft: "He did stuff and things got worse."\n\nRevision: "He deleted the paragraph, rewrote the claim, word count still climbed."\n\nTeaching point: name the real action, not "did".`
    };

    const WEAK_VERB_TEMPLATES_JUNIOR = {
        copula: `JUNIOR WORKED EXAMPLE (be-verbs)\n\nDraft: "The forest was dark and I was scared."\n\nRevision: "Dark trees closed around the path. Mud sucked at my boots and every snap made my skin jump."\n\nTeaching point: swap some "was" for actions and senses—you still need "was" sometimes.`,
        have: `JUNIOR WORKED EXAMPLE (have / has / had)\n\nDraft: "I had a problem and I had to finish."\n\nRevision: "I still owed two paragraphs. The clock said 11:40."\n\nTeaching point: say what you owed or faced instead of "had to".`,
        do: `JUNIOR WORKED EXAMPLE (do / did)\n\nDraft: "I did the task fast."\n\nRevision: "I rewrote the intro and fixed the quotes in ten minutes."\n\nTeaching point: name the real steps instead of "did".`,
        get: `JUNIOR WORKED EXAMPLE (get / got)\n\nDraft: "He got angry and got an idea."\n\nRevision: "His face went hot. Then an idea hit him: leave now."\n\nTeaching point: "get" hides meaning—use became, had, found, left.`,
        go: `JUNIOR WORKED EXAMPLE (go / went)\n\nDraft: "We went to the beach and went home late."\n\nRevision: "We drove to the beach with the windows down, then drove home after dark."\n\nTeaching point: say how you moved: drove, walked, ran.`,
        make: `JUNIOR WORKED EXAMPLE (make / made)\n\nDraft: "She made a choice and it made her nervous."\n\nRevision: "She picked the harder subject and her stomach flipped as she pressed send."\n\nTeaching point: swap "made a choice" for chose or picked.`,
        take: `JUNIOR WORKED EXAMPLE (take / took)\n\nDraft: "He took the book and took a breath."\n\nRevision: "He grabbed the book and breathed in once, slow."\n\nTeaching point: use grabbed, lifted, breathed—whatever really happened.`,
        come: `JUNIOR WORKED EXAMPLE (come / came)\n\nDraft: "He came in and came over."\n\nRevision: "He pushed through the door and crossed the room in three steps."\n\nTeaching point: show the movement in plain verbs.`,
        put: `JUNIOR WORKED EXAMPLE (put)\n\nDraft: "He put the bag down and put his hand on the table."\n\nRevision: "He dropped the bag and pressed his hand flat on the table."\n\nTeaching point: choose a sharper verb than "put" when you can.`,
        seem: `JUNIOR WORKED EXAMPLE (seem / look)\n\nDraft: "He seemed angry."\n\nRevision: "His jaw was tight and he stared at his shoes."\n\nTeaching point: show what people see instead of "seemed".`,
        find: `JUNIOR WORKED EXAMPLE (find / found)\n\nDraft: "I found the answer was simple."\n\nRevision: "I read the footnote again and then the pattern was obvious."\n\nTeaching point: show the step you took before you understood.`,
        want: `JUNIOR WORKED EXAMPLE (want / need)\n\nDraft: "I wanted to leave."\n\nRevision: "The room smelled like wet coats. I walked out into the corridor."\n\nTeaching point: show why your body wanted to leave.`,
        use: `JUNIOR WORKED EXAMPLE (try / use)\n\nDraft: "I tried to write."\n\nRevision: "I wrote a plan with three bullet points, then fixed the weakest paragraph."\n\nTeaching point: list what you actually did.`,
        help: `JUNIOR WORKED EXAMPLE (help / show)\n\nDraft: "Let me help you."\n\nRevision: "Do this: put the quote after your claim, then explain it in one sentence."\n\nTeaching point: give the help straight away instead of talking about helping.`,
        contraction: `JUNIOR WORKED EXAMPLE (contractions)\n\nDraft: "It’s clear we can’t wait."\n\nRevision: "It is clear we cannot wait if we want to pass."\n\nTeaching point: full forms often sound more formal in essays—ask your teacher what they want.`,
        utility: `JUNIOR WORKED EXAMPLE (weak verbs)\n\nDraft: "He did stuff and things got worse."\n\nRevision: "He deleted his paragraph and the word count still went up."\n\nTeaching point: name the real action instead of "did".`
    };

    const ADVERB_MASTER = `WORKED EXAMPLE (-ly adverbs)\n\nYou flagged: "{{WORD}}"\n\nDraft: "She walked slowly down the hall."\n\nRevision: "She edged down the hall, heel-to-toe, glancing back when the lights flickered."\n\nTeaching point: swap "{{WORD}}" for a verb that already carries manner, or add one concrete image.`;

    const ADVERB_MASTER_JUNIOR = `JUNIOR WORKED EXAMPLE (-ly)\n\nYou flagged: "{{WORD}}"\n\nDraft: "She walked slowly down the hall."\n\nRevision: "She took tiny steps and looked back each time the lights flickered."\n\nTeaching point: swap "{{WORD}}" for a stronger verb or one clear picture.`;

    const BASIC_GROUP = {
        emotion: ['happy', 'sad', 'scared', 'angry', 'mad', 'glad'],
        quality: ['nice', 'good', 'bad', 'great', 'awesome', 'cool', 'terrible', 'horrible', 'fun'],
        size: ['big', 'small', 'long', 'short'],
        motion: ['walk', 'walks', 'walked', 'walking', 'run', 'runs', 'ran', 'running'],
        speech: ['say', 'says', 'said', 'saying'],
        sensory: ['fast', 'slow', 'loud', 'quiet', 'hot', 'cold', 'hard', 'easy'],
        abstract: ['old', 'new'],
        entities: ['people', 'person', 'guy', 'girl', 'boy', 'man', 'woman', 'kid', 'kids', 'child', 'children'],
        generic: ['stuff', 'thing', 'things']
    };

    const BASIC_TO_GROUP = (function () {
        const o = {};
        Object.keys(BASIC_GROUP).forEach((g) => BASIC_GROUP[g].forEach((w) => (o[w] = g)));
        return o;
    })();

    const BASIC_TEMPLATES = {
        emotion: `WORKED EXAMPLE (emotion words)\n\nDraft: "I was sad and then I was angry."\n\nRevision: "The news landed like a bruise; I gripped the chair until my knuckles whitened."\n\nTeaching point: trade the label for body, action, or one sharp image.`,

        quality: `WORKED EXAMPLE (good / bad / nice)\n\nDraft: "It was a nice day and we had fun."\n\nRevision: "Sunlight hammered the oval; someone skidded a goal in thongs."\n\nTeaching point: one concrete detail beats "nice/good/fun".`,

        size: `WORKED EXAMPLE (big / small)\n\nDraft: "The dog was big and the house was small."\n\nRevision: "The dog’s shoulders reached my ribs; in the fibro cottage its tail cleared a mug."\n\nTeaching point: compare to a body, room, or number.`,

        motion: `WORKED EXAMPLE (walk / run)\n\nDraft: "I walked in and ran out."\n\nRevision: "I slipped inside on cold air; two minutes later I burst onto the verandah, lungs burning."\n\nTeaching point: crept, stumbled, sprinted—verbs that carry attitude.`,

        speech: `WORKED EXAMPLE (say / said)\n\nDraft: "He said hello and she said goodbye."\n\nRevision: "'Hello,' he tried—too bright. She didn’t look up. 'Goodbye,' she murmured to the screen."\n\nTeaching point: mix lines with small beats; vary "said" only when it earns.`,

        sensory: `WORKED EXAMPLE (loud / hot / fast)\n\nDraft: "It was loud and hot."\n\nRevision: "The gym felt like a kiln—squeaks, whistles, fans pushing hot air."\n\nTeaching point: name what makes the sense (sources, machines).`,

        abstract: `WORKED EXAMPLE (old / new)\n\nDraft: "It was old and I wanted something new."\n\nRevision: "The hinge groaned; the battery bulged. I priced replacements I couldn’t afford."\n\nTeaching point: show wear, year, or contrast—skip bare "old/new".`,

        entities: `WORKED EXAMPLE (people / kids)\n\nDraft: "There were many people and some kids."\n\nRevision: "Parents clustered at the gate; Year 7s shoved near the canteen."\n\nTeaching point: name a role, age band, or one mini-portrait.`,

        generic: `WORKED EXAMPLE (stuff / thing)\n\nDraft: "I had things to do and stuff kept happening."\n\nRevision: "I owed a science abstract, a history paragraph, a permission slip—then the Wi‑Fi died."\n\nTeaching point: list nouns a camera could film.`
    };

    const BASIC_TEMPLATES_JUNIOR = {
        emotion: `JUNIOR WORKED EXAMPLE (emotion words)\n\nDraft: "I was sad and then angry."\n\nRevision: "I slumped in the chair. Then I stood up fast and my voice went sharp."\n\nTeaching point: show face, hands, and voice instead of naming the emotion only.`,
        quality: `JUNIOR WORKED EXAMPLE (good / bad / nice)\n\nDraft: "It was a nice day."\n\nRevision: "The sun was hot on the oval and someone scored in thongs."\n\nTeaching point: one clear picture beats "nice".`,
        size: `JUNIOR WORKED EXAMPLE (big / small)\n\nDraft: "The dog was big."\n\nRevision: "The dog’s back reached my ribs when it stood."\n\nTeaching point: compare to a body or a room so size feels real.`,
        motion: `JUNIOR WORKED EXAMPLE (walk / run)\n\nDraft: "I walked in and ran out."\n\nRevision: "I slipped inside, then sprinted back out when I saw the time."\n\nTeaching point: choose verbs that fit the mood: slipped, rushed, stomped.`,
        speech: `JUNIOR WORKED EXAMPLE (say / said)\n\nDraft: "He said hi and she said bye."\n\nRevision: "'Hi,' he said. She didn’t look up. 'Bye,' she whispered to her phone."\n\nTeaching point: add a small action so we see the scene.`,
        sensory: `JUNIOR WORKED EXAMPLE (loud / hot)\n\nDraft: "It was loud and hot."\n\nRevision: "Whistles screeched and the air in the gym felt thick."\n\nTeaching point: name what made the noise and heat.`,
        abstract: `JUNIOR WORKED EXAMPLE (old / new)\n\nDraft: "It was old."\n\nRevision: "The screen had cracks in the corner and the battery swelled."\n\nTeaching point: show age with damage or a date.`,
        entities: `JUNIOR WORKED EXAMPLE (people / kids)\n\nDraft: "There were people and kids."\n\nRevision: "Parents waited at the gate while Year 7s pushed near the canteen."\n\nTeaching point: name one group and one place.`,
        generic: `JUNIOR WORKED EXAMPLE (stuff / things)\n\nDraft: "I had things to do."\n\nRevision: "I had maths homework, a form for sport, and a speech draft."\n\nTeaching point: list three real jobs instead of "things".`
    };

    const PER_WORD = {
        // --- Filler / intensifiers ---
        very: `WORKED EXAMPLE: "very"\n\nDraft: "The storm was very loud and the house felt very small."\n\nRevision: "The storm tore at the roof—tin screaming—and the hallway shrank to a tunnel of noise."\n\nTeaching point: delete "very" and upgrade the noun/verb, or add one measurable detail.`,
        really: `WORKED EXAMPLE: "really"\n\nDraft: "I was really tired after school."\n\nRevision: "After school my shoulders sagged; I leaned on the kitchen counter, phone face-down."\n\nTeaching point: show fatigue with body or action; "really" is often a shortcut.`,
        just: `WORKED EXAMPLE: "just"\n\nDraft: "I just wanted to help and I just didn’t know."\n\nRevision: "I wanted to help—no performance—and I didn’t know the rule until too late."\n\nTeaching point: "just" often apologizes; decide if you want assertive or hesitant tone.`,
        quite: `WORKED EXAMPLE: "quite"\n\nDraft: "It was quite important and quite difficult."\n\nRevision: "It mattered for our semester average—and it was the hardest paragraph I’ve drafted."\n\nTeaching point: replace hedges with evidence or a precise adjective.`,
        too: `WORKED EXAMPLE: "too"\n\nDraft: "It was too hard."\n\nRevision: "I failed three starts; each thesis collapsed when evidence wouldn’t line up."\n\nTeaching point: show what "too" means with attempts, constraints, or consequences.`,
        actually: `WORKED EXAMPLE: "actually"\n\nDraft: "Actually, I think we should stop."\n\nRevision: "We should stop—now—before someone gets hurt."\n\nTeaching point: cut oral scaffolding; let the claim land.`,
        basically: `WORKED EXAMPLE: "basically"\n\nDraft: "Basically, the story is about friendship."\n\nRevision: "The story tests whether loyalty survives public shame—starting when Mara covers for a friend she no longer trusts."\n\nTeaching point: replace summary filler with a precise one-sentence pitch.`,
        totally: `WORKED EXAMPLE: "totally"\n\nDraft: "I totally agree."\n\nRevision: "I agree: the plan trades short-term comfort for long-term risk."\n\nTeaching point: show what you agree with; slang intensifiers weaken analytical tone.`,
        definitely: `WORKED EXAMPLE: "definitely"\n\nDraft: "It will definitely rain."\n\nRevision: "BOM forecasts an 80% chance by 4:00; the oval will be a sponge."\n\nTeaching point: replace certainty hype with evidence or qualification.`,
        literally: `WORKED EXAMPLE: "literally"\n\nDraft: "I literally died."\n\nRevision: "Embarrassment scorched my face; I wanted the floor to open."\n\nTeaching point: use "literally" only for literal truth—or delete.`,
        simply: `WORKED EXAMPLE: "simply"\n\nDraft: "We simply cannot agree."\n\nRevision: "We cannot agree: your model ignores the outlier schools."\n\nTeaching point: "simply" often bluffs simplicity; show the real conflict.`,
        truly: `WORKED EXAMPLE: "truly"\n\nDraft: "It was truly amazing."\n\nRevision: "The choir hit the high note clean—silence for half a beat—then the crowd erupted."\n\nTeaching point: show the amazement; don’t label it.`,
        extremely: `WORKED EXAMPLE: "extremely"\n\nDraft: "She was extremely angry."\n\nRevision: "She spoke through her teeth, each word clipped, smile gone."\n\nTeaching point: intensity belongs in verbs and images.`,
        somewhat: `WORKED EXAMPLE: "somewhat"\n\nDraft: "It was somewhat confusing."\n\nRevision: "The instructions contradicted the rubric—criteria #2 didn’t match the exemplar."\n\nTeaching point: replace "somewhat" with the exact mismatch.`,
        rather: `WORKED EXAMPLE: "rather"\n\nDraft: "It was rather boring."\n\nRevision: "The lecture repeated last week’s slides—same jokes, slower pace."\n\nTeaching point: specify what made it dull.`,
        pretty: `WORKED EXAMPLE: "pretty" (intensifier)\n\nDraft: "It was pretty good."\n\nRevision: "The opening paragraph earned a tick in the margin; the conclusion still sagged."\n\nTeaching point: split praise and problem with specifics.`,
        highly: `WORKED EXAMPLE: "highly"\n\nDraft: "It is highly likely."\n\nRevision: "Three independent samples show the same drift—likely, not certain."\n\nTeaching point: pair likelihood with reasoning.`,
        bit: `WORKED EXAMPLE: "bit"\n\nDraft: "I was a bit upset."\n\nRevision: "Upset is mild: I couldn’t sleep and I rewrote the message six times."\n\nTeaching point: calibrate emotion with evidence.`,
        'a bit': `WORKED EXAMPLE: "a bit"\n\nDraft: "I was a bit nervous."\n\nRevision: "Nervous is an understatement—my hands shook on the microphone."\n\nTeaching point: show magnitude; avoid vague minimizers.`,
        'kind of': `WORKED EXAMPLE: "kind of"\n\nDraft: "It was kind of unfair."\n\nRevision: "Unfair names the feeling; stronger: the rule penalised students without home printers."\n\nTeaching point: replace hedges with the actual injustice.`,
        'sort of': `WORKED EXAMPLE: "sort of"\n\nDraft: "He was sort of angry."\n\nRevision: "He wasn’t 'sort of' anything—he snapped a pencil and left."\n\nTeaching point: commit to a verb; hedges soften drama into mush.`,
        slightly: `WORKED EXAMPLE: "slightly"\n\nDraft: "It hurt slightly."\n\nRevision: "Pain arrived as a thin line under my ribs—enough to notice, not enough to stop."\n\nTeaching point: precision beats "slightly."`,
        absolutely: `WORKED EXAMPLE: "absolutely"\n\nDraft: "I absolutely refuse."\n\nRevision: "I refuse. I won’t sign until legal reviews the clause."\n\nTeaching point: let dialogue/action carry absoluteness.`,
        completely: `WORKED EXAMPLE: "completely"\n\nDraft: "I completely forgot."\n\nRevision: "I forgot—calendar alert buried under spam—until the due date had passed."\n\nTeaching point: show the failure mode; "completely" is often redundant.`,
        'a lot': `WORKED EXAMPLE: "a lot"\n\nDraft: "I learned a lot."\n\nRevision: "I learned to thread evidence through analysis instead of tacking quotes on at the end."\n\nTeaching point: name what you learned.`,
        lots: `WORKED EXAMPLE: "lots"\n\nDraft: "Lots of people came."\n\nRevision: "Maybe forty chairs filled; latecomers stood along the wall."\n\nTeaching point: quantify or exemplify.`,
        lot: `WORKED EXAMPLE: "lot"\n\nDraft: "I have a lot of homework."\n\nRevision: "I have three drafts due: English, science, and the scholarship form."\n\nTeaching point: list the load.`,
        little: `WORKED EXAMPLE: "little" (vague quantity)\n\nDraft: "I know little about it."\n\nRevision: "I know only the headline facts—date, venue—not the policy details."\n\nTeaching point: specify what you lack.`,
        much: `WORKED EXAMPLE: "much" (vague)\n\nDraft: "There is much to say."\n\nRevision: "Three issues matter: equity, timing, and enforcement."\n\nTeaching point: enumerate instead of "much."`,

        // --- Filters (full set: senior + junior pairs) ---
        think: {
            senior: `WORKED EXAMPLE: "think"\n\nDraft: "I think the author is trying to say that war is bad."\n\nRevision: "The author stages war as domestic routine—socks drying on a tank—so horror arrives as ordinariness."\n\nTeaching point: lead with textual evidence, not the frame "I think."`,
            junior: `JUNIOR WORKED EXAMPLE: "think"\n\nDraft: "I think the story is about war being bad."\n\nRevision: "The story shows soldiers eating breakfast next to their guns, so war feels normal and scary at the same time."\n\nTeaching point: start with what happens in the story, not "I think".`
        },
        thought: {
            senior: `WORKED EXAMPLE: "thought"\n\nDraft: "He thought about his future."\n\nRevision: "He stared at the course booklet until the columns blurred—engineering, teaching, trades—each line a different life."\n\nTeaching point: dramatize reflection with objects, choices, time pressure.`,
            junior: `JUNIOR WORKED EXAMPLE: "thought"\n\nDraft: "He thought about his future."\n\nRevision: "He stared at the course booklet: engineering, teaching, trades—three different lives on three lines."\n\nTeaching point: show what he looks at and what the choices are—skip "thought" as a summary.`
        },
        believe: {
            senior: `WORKED EXAMPLE: "believe"\n\nDraft: "I believe this is important."\n\nRevision: "This matters: without revision, the data’s spike reads like noise."\n\nTeaching point: in analysis, argue from evidence; "believe" can sound like opinion without proof.`,
            junior: `JUNIOR WORKED EXAMPLE: "believe"\n\nDraft: "I believe this is important."\n\nRevision: "This matters because the numbers change when you fix the mistake."\n\nTeaching point: say why it matters with a fact, not "I believe".`
        },
        feel: {
            senior: `WORKED EXAMPLE: "feel"\n\nDraft: "I feel like the poem is sad."\n\nRevision: "The poem’s end-stopped lines and monochrome images build a clipped grief."\n\nTeaching point: anchor feeling in form and diction.`,
            junior: `JUNIOR WORKED EXAMPLE: "feel"\n\nDraft: "I feel like the poem is sad."\n\nRevision: "The poem uses short lines and grey, empty pictures, so the sad mood is clear without saying the word sad."\n\nTeaching point: don’t say "I feel"—show the picture and the sound.`
        },
        felt: {
            senior: `WORKED EXAMPLE: "felt"\n\nDraft: "She felt nervous."\n\nRevision: "Her throat tightened; she rehearsed the first sentence under her breath."\n\nTeaching point: show somatic cues instead of naming "felt."`,
            junior: `JUNIOR WORKED EXAMPLE: "felt"\n\nDraft: "She felt nervous."\n\nRevision: "Her throat went tight and she whispered the first line to herself."\n\nTeaching point: name the body—hands, throat, stomach—instead of "felt nervous".`
        },
        notice: {
            senior: `WORKED EXAMPLE: "notice"\n\nDraft: "I noticed that the door was open."\n\nRevision: "The door hung ajar—one hinge rust-orange—cooler air threading in from the corridor."\n\nTeaching point: cut the filter; give the observation directly.`,
            junior: `JUNIOR WORKED EXAMPLE: "notice"\n\nDraft: "I noticed that the door was open."\n\nRevision: "The door was open a little and cool air came in from the hall."\n\nTeaching point: say what you see first—often you can delete "I noticed".`
        },
        noticed: {
            senior: `WORKED EXAMPLE: "noticed"\n\nDraft: "He noticed a crack in the wall."\n\nRevision: "A crack split the plaster above the light switch—hairline, but longer than yesterday."\n\nTeaching point: show attention through detail, not the verb "noticed."`,
            junior: `JUNIOR WORKED EXAMPLE: "noticed"\n\nDraft: "He noticed a crack in the wall."\n\nRevision: "A crack ran above the light switch—longer than yesterday."\n\nTeaching point: put the crack in the subject slot: "A crack ran…" instead of "He noticed…".`
        },
        decide: {
            senior: `WORKED EXAMPLE: "decide"\n\nDraft: "She decided to leave."\n\nRevision: "She packed her bag in silence—zipper loud—and stepped into the hall without looking back."\n\nTeaching point: show decision as action sequence.`,
            junior: `JUNIOR WORKED EXAMPLE: "decide"\n\nDraft: "She decided to leave."\n\nRevision: "She zipped her bag, stood up, and walked out without turning around."\n\nTeaching point: show three small actions instead of "decided".`
        },
        know: {
            senior: `WORKED EXAMPLE: "know"\n\nDraft: "I know I failed."\n\nRevision: "The mark is printed: 54. My stomach drops anyway, as if the number could change if I stared harder."\n\nTeaching point: replace "I know" with scene or evidence.`,
            junior: `JUNIOR WORKED EXAMPLE: "know"\n\nDraft: "I know I failed."\n\nRevision: "The mark on the page is 54. My stomach still drops when I read it."\n\nTeaching point: show the proof (the number, the comment) instead of "I know".`
        },
        knew: {
            senior: `WORKED EXAMPLE: "knew"\n\nDraft: "He knew it was over."\n\nRevision: "The coach didn’t need words—hands on hips, clipboard tucked under an arm like a white flag."\n\nTeaching point: render certainty as cues readers infer.`,
            junior: `JUNIOR WORKED EXAMPLE: "knew"\n\nDraft: "He knew it was over."\n\nRevision: "The coach put his hands on his hips and looked at the ground. No one needed to speak."\n\nTeaching point: show what everyone can see so we understand he knows.`
        },
        see: {
            senior: `WORKED EXAMPLE: "see"\n\nDraft: "I see what you mean."\n\nRevision: "Your thesis matches the graph’s inflection point—yeah, that’s the stronger read."\n\nTeaching point: in dialogue, fine; in narration, prefer direct image.`,
            junior: `JUNIOR WORKED EXAMPLE: "see"\n\nDraft: "I see what you mean."\n\nRevision: "Your idea matches the bend in the graph—that is the stronger answer."\n\nTeaching point: in speech this is fine; in a written argument, spell the point out without "I see".`
        },
        saw: {
            senior: `WORKED EXAMPLE: "saw"\n\nDraft: "I saw the dragon roar."\n\nRevision: "The dragon roared; loose stones jittered down the cliff face."\n\nTeaching point: delete the camera; show the event.`,
            junior: `JUNIOR WORKED EXAMPLE: "saw"\n\nDraft: "I saw the dog run across the road."\n\nRevision: "The dog shot across the road; a car braked hard."\n\nTeaching point: start with the dog or the car—skip "I saw".`
        },
        wonder: {
            senior: `WORKED EXAMPLE: "wonder"\n\nDraft: "I wondered if she would come."\n\nRevision: "Would she come? I refreshed the thread—still no reply—the minutes stretching."\n\nTeaching point: externalize doubt with action and time.`,
            junior: `JUNIOR WORKED EXAMPLE: "wonder"\n\nDraft: "I wondered if she would come."\n\nRevision: "Would she come? I checked my phone again. Still no message."\n\nTeaching point: ask the question, then show a small action—we get the worry without "I wondered".`
        },
        hear: {
            senior: `WORKED EXAMPLE: "hear"\n\nDraft: "I heard a noise."\n\nRevision: "Metal groaned—one long note—then a crash like bins tipping."\n\nTeaching point: render sound directly.`,
            junior: `JUNIOR WORKED EXAMPLE: "hear"\n\nDraft: "I heard a noise."\n\nRevision: "Metal groaned, then something crashed like bins falling."\n\nTeaching point: describe the sound first—"I heard" is often optional.`
        },
        heard: {
            senior: `WORKED EXAMPLE: "heard"\n\nDraft: "She heard footsteps."\n\nRevision: "Footsteps climbed—two sets, out of sync—stopping outside her door."\n\nTeaching point: lead with the sensory fact.`,
            junior: `JUNIOR WORKED EXAMPLE: "heard"\n\nDraft: "She heard footsteps."\n\nRevision: "Footsteps came up the stairs—two people, not in time—and stopped outside her door."\n\nTeaching point: lead with "Footsteps…" instead of "She heard".`
        },
        realize: {
            senior: `WORKED EXAMPLE: "realize"\n\nDraft: "I realized I was lost."\n\nRevision: "The street names stopped matching the map; the bakery on the corner should have been three blocks back."\n\nTeaching point: show the moment understanding arrives as concrete mismatch.`,
            junior: `JUNIOR WORKED EXAMPLE: "realize"\n\nDraft: "I realized I was lost."\n\nRevision: "The street names did not match the map. The shop on the corner was wrong."\n\nTeaching point: show two facts that don’t fit—then we realise with you.`
        },
        realized: {
            senior: `WORKED EXAMPLE: "realized"\n\nDraft: "He realized his mistake."\n\nRevision: "The date on the email—yesterday—burned under his thumb; he had missed the window."\n\nTeaching point: replace "realized" with the evidence that forces insight.`,
            junior: `JUNIOR WORKED EXAMPLE: "realized"\n\nDraft: "He realized his mistake."\n\nRevision: "The email said yesterday. He had missed the deadline."\n\nTeaching point: show the proof on the page, then the feeling—often you can cut "realized".`
        },
        decided: {
            senior: `WORKED EXAMPLE: "decided"\n\nDraft: "They decided to cancel."\n\nRevision: "They cancelled—email at 6:12—rainwater already pooling on the synthetic turf."\n\nTeaching point: show institutional action with timestamp/cause.`,
            junior: `JUNIOR WORKED EXAMPLE: "decided"\n\nDraft: "They decided to cancel."\n\nRevision: "They cancelled the match because the field was flooded."\n\nTeaching point: say the action and the reason in plain words.`
        },
        understand: {
            senior: `WORKED EXAMPLE: "understand"\n\nDraft: "I understand the text."\n\nRevision: "The text pairs privilege with cleanliness—white tiles, soft hands—so access becomes sensory."\n\nTeaching point: show understanding as paraphrase tied to evidence.`,
            junior: `JUNIOR WORKED EXAMPLE: "understand"\n\nDraft: "I understand the text."\n\nRevision: "The story links being rich to having clean hands and white tiles."\n\nTeaching point: put the idea in your own simple words and add one example from the text.`
        },
        understood: {
            senior: `WORKED EXAMPLE: "understood"\n\nDraft: "She understood the risk."\n\nRevision: "The risk had a face: expulsion, scholarship gone, parents on a plane."\n\nTeaching point: concretize abstraction.`,
            junior: `JUNIOR WORKED EXAMPLE: "understood"\n\nDraft: "She understood the risk."\n\nRevision: "She could lose her place, her scholarship, and her parents would fly home angry."\n\nTeaching point: list what could go wrong in simple terms.`
        },
        remember: {
            senior: `WORKED EXAMPLE: "remember"\n\nDraft: "I remember my childhood."\n\nRevision: "Childhood returns as smell—diesel and cut grass, the bus idling at the crest."\n\nTeaching point: one sharp memory beats "remember" as summary.`,
            junior: `JUNIOR WORKED EXAMPLE: "remember"\n\nDraft: "I remember my childhood."\n\nRevision: "I still smell diesel and cut grass from waiting for the school bus on the hill."\n\nTeaching point: give one smell or sound instead of "I remember".`
        },
        remembered: {
            senior: `WORKED EXAMPLE: "remembered"\n\nDraft: "He remembered the promise."\n\nRevision: "The promise sat in his pocket—folded paper soft at the creases."\n\nTeaching point: objectify memory.`,
            junior: `JUNIOR WORKED EXAMPLE: "remembered"\n\nDraft: "He remembered the promise."\n\nRevision: "The folded note in his pocket had gone soft at the edges."\n\nTeaching point: show the object—readers remember with him.`
        },
        wondered: {
            senior: `WORKED EXAMPLE: "wondered"\n\nDraft: "She wondered what would happen."\n\nRevision: "What would happen? The question looped; she opened the draft anyway and deleted the first line."\n\nTeaching point: turn wonder into action or split-screen tension.`,
            junior: `JUNIOR WORKED EXAMPLE: "wondered"\n\nDraft: "She wondered what would happen."\n\nRevision: "What would happen next? She opened the draft and deleted the first line anyway."\n\nTeaching point: ask the question out loud, then show a small action.`
        },

        // --- Modals / habit (representative robust examples) ---
        would: `WORKED EXAMPLE: "would"\n\nDraft: "I would go, but I can’t."\n\nRevision: "I want to go; work starts at five and I’m covering a shift."\n\nTeaching point: modal hedging is fine in speech—tighten for analytical claims.`,
        could: `WORKED EXAMPLE: "could"\n\nDraft: "It could be true."\n\nRevision: "It may be true—supported by Study B—but Study A’s sample is tiny."\n\nTeaching point: pair possibility with evidence.`,
        should: `WORKED EXAMPLE: "should"\n\nDraft: "We should do better."\n\nRevision: "We need clearer rubrics and timed feedback loops—two changes that are measurable."\n\nTeaching point: replace moral "should" with actionable criteria.`,
        might: `WORKED EXAMPLE: "might"\n\nDraft: "It might rain."\n\nRevision: "Forecast: 60% after lunch; the carnival should move undercover."\n\nTeaching point: qualify with basis.`,
        may: `WORKED EXAMPLE: "may"\n\nDraft: "This may cause problems."\n\nRevision: "This risks bandwidth collapse during uploads—especially on shared Wi‑Fi."\n\nTeaching point: name the risk mechanism.`,
        can: `WORKED EXAMPLE: "can"\n\nDraft: "I can swim."\n\nRevision: "I swim—club training Tuesdays—but open water still unnerves me."\n\nTeaching point: "can" is ability; add scope if stakes matter.`,
        shall: `WORKED EXAMPLE: "shall"\n\nDraft: "We shall see."\n\nRevision: "We’ll know after moderation—Friday."\n\nTeaching point: modern prose rarely needs "shall"—unless formal tone is deliberate.`,
        will: `WORKED EXAMPLE: "will"\n\nDraft: "It will be fine."\n\nRevision: "It will be fine if we submit before midnight—otherwise the portal locks."\n\nTeaching point: attach conditions; avoid empty reassurance.`,
        must: `WORKED EXAMPLE: "must"\n\nDraft: "You must listen."\n\nRevision: "Listen: the policy shifts liability onto students for device damage."\n\nTeaching point: command needs stakes; show why it’s non-negotiable.`,
        maybe: `WORKED EXAMPLE: "maybe"\n\nDraft: "Maybe we should start."\n\nRevision: "Start now—draft the plan in ten minutes, then assign roles."\n\nTeaching point: replace hesitation with leadership verbs.`,
        perhaps: `WORKED EXAMPLE: "perhaps"\n\nDraft: "Perhaps it is wrong."\n\nRevision: "The conclusion overreaches; the evidence supports a narrower claim."\n\nTeaching point: analytical hedges need a following clause.`,
        possibly: `WORKED EXAMPLE: "possibly"\n\nDraft: "It is possibly true."\n\nRevision: "It’s plausible only if we exclude the outlier district."\n\nTeaching point: tie possibility to conditions.`,
        probably: `WORKED EXAMPLE: "probably"\n\nDraft: "He is probably tired."\n\nRevision: "He’s been awake thirty hours—slurred words, missed turns."\n\nTeaching point: show probability with signs.`,
        likely: `WORKED EXAMPLE: "likely"\n\nDraft: "It is likely."\n\nRevision: "Likely, given three corroborating accounts and timestamps."\n\nTeaching point: follow "likely" with why.`,
        'started to': `WORKED EXAMPLE: "started to"\n\nDraft: "He started to run."\n\nRevision: "He sprinted—bag slapping his hip—until the corner blinded him with sun."\n\nTeaching point: cut the habitual frame; jump to the verb.`,
        'began to': `WORKED EXAMPLE: "began to"\n\nDraft: "She began to cry."\n\nRevision: "Tears came—hot, embarrassing—one hand clamped over her mouth."\n\nTeaching point: show onset without "began to."`,
        'proceeded to': `WORKED EXAMPLE: "proceeded to"\n\nDraft: "He proceeded to explain."\n\nRevision: "He explained: two steps—first isolate the variable, then rerun the trial."\n\nTeaching point: bureaucratic "proceeded to" rarely helps student voice.`,
        'meaning that': `WORKED EXAMPLE: "meaning that"\n\nDraft: "The curve flattened, meaning that growth slowed."\n\nRevision: "The curve flattened; growth slowed after Q2."\n\nTeaching point: use a colon, semicolon, or causal clause—tighter than "meaning that."`,

        // --- Clichés (phrases as keys) ---
        'cold as ice': `WORKED EXAMPLE: cliché\n\nDraft: "Her hands were cold as ice."\n\nRevision: "Her hands felt refrigerated—veins blue, nails lavender."\n\nTeaching point: invent one fresh comparison tied to your setting.`,
        'piece of cake': `WORKED EXAMPLE: cliché\n\nDraft: "The test was a piece of cake."\n\nRevision: "The test rewarded memorisation—definitions only—so the night’s cramming paid off."\n\nTeaching point: name why it felt easy.`,
        'quiet as a mouse': `WORKED EXAMPLE: cliché\n\nDraft: "He was quiet as a mouse."\n\nRevision: "He went still—breath shallow—watching the hallway light fan under the door."\n\nTeaching point: quiet is motion + breath + attention.`,
        'at the end of the day': `WORKED EXAMPLE: cliché\n\nDraft: "At the end of the day, we all want safety."\n\nRevision: "When budgets shrink, communities still expect libraries open and buses on time."\n\nTeaching point: replace slogan closers with concrete shared stakes.`,
        'avoid like the plague': `WORKED EXAMPLE: cliché\n\nDraft: "I avoid drama like the plague."\n\nRevision: "I dodge group chats where rumours sprout—mute, archive, out."\n\nTeaching point: show avoidance with habit, not idiom.`,
        'break the ice': `WORKED EXAMPLE: cliché\n\nDraft: "We played a game to break the ice."\n\nRevision: "We played two truths—embarrassing, small—until someone laughed too loud and the room loosened."\n\nTeaching point: dramatize the moment; name the activity.`,
        'light as a feather': `WORKED EXAMPLE: cliché\n\nDraft: "The box felt light as a feather."\n\nRevision: "The box felt wrong-light—empty or nearly—tape peeling at one corner."\n\nTeaching point: give the wrongness a clue.`,
        'red as a beet': `WORKED EXAMPLE: cliché\n\nDraft: "He went red as a beet."\n\nRevision: "Colour climbed his throat; he studied his shoes like they held instructions."\n\nTeaching point: embarrassment reads in heat, gaze, breath.`,
        'scared to death': `WORKED EXAMPLE: cliché\n\nDraft: "I was scared to death."\n\nRevision: "Fear turned my mouth metallic; I counted exits—two—like counting heartbeats."\n\nTeaching point: hyperbole is fine in voice—make it specific.`,

        // --- Subjective / analytical ---
        i: `WORKED EXAMPLE (analytical mode): "I"\n\nDraft: "I think the poem is about loss."\n\nRevision: "The poem figures loss through absent objects—empty chair, stopped clock—rather than stating grief."\n\nTeaching point: lead with textual evidence, not first-person opinion scaffolding.`,
        me: `WORKED EXAMPLE: "me"\n\nDraft: "The text reminds me of my life."\n\nRevision: "The text’s depiction of caregiving aligns with contemporary memoir conventions—daily tasks rendered as moral weight."\n\nTeaching point: replace personal anecdote with analytical comparison unless reflection is assigned.`,
        my: `WORKED EXAMPLE: "my"\n\nDraft: "In my opinion, the author is biased."\n\nRevision: "The author selects sources from a single outlet—bias emerges in omission, not tone."\n\nTeaching point: show bias with citation patterns.`,
        mine: `WORKED EXAMPLE: "mine"\n\nDraft: "That idea was mine."\n\nRevision: "The argument first appears in Carter (2019), p. 42—predating the blog post."\n\nTeaching point: ownership claims need evidence in scholarship.`,
        we: `WORKED EXAMPLE: "we"\n\nDraft: "We live in a society."\n\nRevision: "Public funding shapes who accesses transport, childcare, and healthcare—structures, not vibes."\n\nTeaching point: avoid universal "we" unless your scope is defined.`,
        us: `WORKED EXAMPLE: "us"\n\nDraft: "They lied to us."\n\nRevision: "The memo misstates dates—verified against the original tender."\n\nTeaching point: specify the group affected.`,
        our: `WORKED EXAMPLE: "our"\n\nDraft: "In our world, technology is important."\n\nRevision: "In Australian classrooms, device access remains uneven across postcodes."\n\nTeaching point: replace rhetorical "our" with a defined population.`,
        ours: `WORKED EXAMPLE: "ours"\n\nRevision: "The dataset is communal—license prohibits resale."\n\nTeaching point: define collective ownership precisely.`,
        you: `WORKED EXAMPLE: "you"\n\nDraft: "You know how it is."\n\nRevision: "Exam weeks compress time; sleep becomes negotiable."\n\nTeaching point: second person is fine for persuasion—avoid empty "you know."`,
        your: `WORKED EXAMPLE: "your"\n\nDraft: "In your mind, you agree."\n\nRevision: "Readers familiar with the policy will recognise the liability shift."\n\nTeaching point: address the reader with clarity, not mind-reading.`,
        yours: `WORKED EXAMPLE: "yours"\n\nDraft: "The choice is yours."\n\nRevision: "The report presents two viable models—costed across three years."\n\nTeaching point: offer decision criteria, not theatrical freedom.`
    };

    // Opening variety: per-word (sentence-start teaching)
    const OPENING_EXAMPLES = {
        the: `WORKED EXAMPLE (opening): "The…"\n\nDraft (repetitive): "The morning was cold. The bus was late. The teacher looked tired."\n\nRevision (varied subjects + concrete): "Frost filmed the oval. Bus 442 idled past empty seats. Ms Okonkwo rubbed her temples—fluorescents buzzing."\n\nTeaching point: "The" often starts exposition; interleave a time marker, a named actor, or a sensory noun as subject.`,
        it: `WORKED EXAMPLE (opening): "It…"\n\nDraft: "It was raining. It was cold. It made me sad."\n\nRevision: "Rain drilled the footpath; wind found the gap in my jacket. Sadness wasn’t a label—it sat in my stomach, heavy."\n\nTeaching point: replace empty "it" + copula with weather, objects, or body cues; name what "it" hides.`,
        a: `WORKED EXAMPLE (opening): "A…"\n\nDraft: "A boy walked in. A girl looked up. A teacher sighed."\n\nRevision: "A boy shouldered through the door—mud on his runners—and the room’s noise dipped. The girl at the window looked up; the teacher’s sigh was almost soundless."\n\nTeaching point: "A" can work—just avoid the same pattern every sentence; add specificity after the article.`,
        an: `WORKED EXAMPLE (opening): "An…"\n\nDraft: "An idea came to me. An answer appeared. An hour passed."\n\nRevision: "An idea arrived—not gentle: if I swapped the introduction, the whole argument snapped into place."\n\nTeaching point: make the noun after "an" do real work; avoid abstract series.`,
        he: `WORKED EXAMPLE (opening): "He…"\n\nDraft: "He walked. He sat. He waited."\n\nRevision: "He crossed the room like he was counting exits—sat, then waited, thumbs working a tear in his jeans."\n\nTeaching point: chain "he" beats only if each beat adds new information; otherwise combine or vary the subject.`,
        she: `WORKED EXAMPLE (opening): "She…"\n\nDraft: "She was nervous. She looked at the door. She waited."\n\nRevision: "Nerves showed in her laugh—too bright. Her eyes kept catching the door; she wasn’t waiting, she was bracing."\n\nTeaching point: dramatize interiority without repeating "she + verb" like a metronome.`,
        his: `WORKED EXAMPLE (opening): "His…"\n\nDraft: "His hands were shaking. His voice was quiet. His eyes were red."\n\nRevision: "His hands shook—ink smearing the margin. His voice barely carried past the first row."\n\nTeaching point: possessive openings work when the owned detail is sharp; avoid three in a row without a change of camera angle.`,
        her: `WORKED EXAMPLE (opening): "Her…"\n\nDraft: "Her bag was heavy. Her phone buzzed. Her friend waved."\n\nRevision: "Her bag dragged at her shoulder; the phone buzzed twice—unknown number—then her friend waved from the gate."\n\nTeaching point: compress related beats into one sentence; vary sentence openings across the paragraph.`,
        this: `WORKED EXAMPLE (opening): "This…"\n\nDraft: "This is important. This shows the theme. This proves my point."\n\nRevision: "This matters because the graph’s slope changes after 2019—policy, not chance."\n\nTeaching point: "This" needs a clear referent; point to the exact evidence, not a vague claim.`,
        these: `WORKED EXAMPLE (opening): "These…"\n\nDraft: "These things are true. These ideas are good."\n\nRevision: "These three studies share a flaw: convenience sampling in urban schools only."\n\nTeaching point: enumerate what "these" names; analytical writing rewards precision.`,
        those: `WORKED EXAMPLE (opening): "Those…"\n\nDraft: "Those people are wrong. Those kids are loud."\n\nRevision: "Those parents—quoted in the minutes—oppose the merger; their concern is bus routes, not drama."\n\nTeaching point: replace vague "those" with a defined group and evidence.`,
        they: `WORKED EXAMPLE (opening): "They…"\n\nDraft: "They said it was fine. They didn’t care. They left."\n\nRevision: "Admin said it was fine on paper; teachers read it as abandonment—and left early."\n\nTeaching point: name who "they" is when stakes are high; anonymity protects power.`,
        there: `WORKED EXAMPLE (opening): "There…"\n\nDraft: "There was a problem. There were many people. There was noise."\n\nRevision: "A problem: the upload cap—silent until someone lost a draft at 11:58."\n\nTeaching point: replace "there was/existed" with a concrete subject + verb when you can.`,
        then: `WORKED EXAMPLE (opening): "Then…"\n\nDraft: "Then I went home. Then I slept. Then I woke up."\n\nRevision: "By midnight I was home—shoes kicked off—sleep dragging me under until alarms tore morning open."\n\nTeaching point: "then" as a starter becomes a slideshow; use time stamps, causality, or merge beats.`,
        i: `WORKED EXAMPLE (opening): "I…"\n\nDraft: "I walked in. I saw him. I felt scared."\n\nRevision: "I stepped inside—coffee bitter in the air—and saw him by the window; fear wasn’t a word, it was cold in my throat."\n\nTeaching point: "I" is fine in narrative; vary with setting and sensation so it doesn’t become a list.`,
        my: `WORKED EXAMPLE (opening): "My…"\n\nDraft: "My bag was heavy. My phone died. My brother called."\n\nRevision: "My bag’s strap dug a line into my shoulder; the phone died mid-message—then my brother called the landline, voice thin."\n\nTeaching point: stack possessives only when each adds new information.`,
        we: `WORKED EXAMPLE (opening): "We…"\n\nDraft: "We went to the park. We ate food. We went home."\n\nRevision: "We cut through the park—hot chips, seagulls wheeling—then home before the storm broke."\n\nTeaching point: "we" needs shared action with texture; otherwise it reads like minutes.`,
        suddenly: `WORKED EXAMPLE (opening): "Suddenly…"\n\nDraft: "Suddenly, the door opened. Suddenly, there was noise."\n\nRevision: "The door slammed—no footsteps first—noise flooding in like cold water."\n\nTeaching point: show surprise with sequence and sound; "suddenly" is often redundant if pacing does its job.`
    };

    const OPENING_JUNIOR = {
        the: `JUNIOR WORKED EXAMPLE (opening): "The…"\n\nDraft: "The morning was cold. The bus was late. The teacher looked tired."\n\nRevision: "Frost sat on the grass. Bus 442 was late. Ms Okonkwo rubbed her eyes."\n\nTeaching point: change the subject of each sentence—time, vehicle, person—so the first word is not always "The".`,
        it: `JUNIOR WORKED EXAMPLE (opening): "It…"\n\nDraft: "It was raining. It was cold."\n\nRevision: "Rain hit the path. Wind pushed through my jacket."\n\nTeaching point: start with rain or wind instead of "It was".`,
        a: `JUNIOR WORKED EXAMPLE (opening): "A…"\n\nDraft: "A boy walked in. A girl looked up."\n\nRevision: "A boy with muddy shoes pushed in. By the window, a girl looked up."\n\nTeaching point: add one detail after "A" so each line feels new.`,
        an: `JUNIOR WORKED EXAMPLE (opening): "An…"\n\nDraft: "An idea came to me."\n\nRevision: "One idea hit me: fix the first paragraph and the rest gets easier."\n\nTeaching point: say the idea in plain words instead of "An idea came…".`,
        he: `JUNIOR WORKED EXAMPLE (opening): "He…"\n\nDraft: "He walked. He sat. He waited."\n\nRevision: "He crossed the room, sat down, and picked at a hole in his jeans while he waited."\n\nTeaching point: join short "He" lines into one sentence or change the subject.`,
        she: `JUNIOR WORKED EXAMPLE (opening): "She…"\n\nDraft: "She was nervous. She looked at the door."\n\nRevision: "Her laugh was too loud. Her eyes kept going to the door."\n\nTeaching point: show nerves with what we see and hear.`,
        his: `JUNIOR WORKED EXAMPLE (opening): "His…"\n\nDraft: "His hands shook. His voice was quiet."\n\nRevision: "His hands shook and ink smudged the page. His voice barely reached the front row."\n\nTeaching point: one strong detail beats three short "His" sentences.`,
        her: `JUNIOR WORKED EXAMPLE (opening): "Her…"\n\nDraft: "Her bag was heavy. Her phone buzzed."\n\nRevision: "Her bag pulled on her shoulder; the phone buzzed twice before her friend waved."\n\nTeaching point: link details into one clear picture.`,
        this: `JUNIOR WORKED EXAMPLE (opening): "This…"\n\nDraft: "This is important. This shows the theme."\n\nRevision: "The graph jumps after 2019—that is the important part."\n\nTeaching point: point to the thing on the page before you say "this".`,
        these: `JUNIOR WORKED EXAMPLE (opening): "These…"\n\nDraft: "These things are true."\n\nRevision: "These three studies all use kids from city schools only—that is the shared problem."\n\nTeaching point: name how many and what kind.`,
        those: `JUNIOR WORKED EXAMPLE (opening): "Those…"\n\nDraft: "Those kids are loud."\n\nRevision: "The Year 7s near the canteen were shouting and shoving."\n\nTeaching point: name the group instead of "those".`,
        they: `JUNIOR WORKED EXAMPLE (opening): "They…"\n\nDraft: "They said it was fine. They left."\n\nRevision: "The office said the plan was fine on paper, but the teachers left early anyway."\n\nTeaching point: say who "they" is when it matters.`,
        there: `JUNIOR WORKED EXAMPLE (opening): "There…"\n\nDraft: "There was a problem. There was noise."\n\nRevision: "The upload broke at 11:58 and the hall went wild."\n\nTeaching point: start with what broke or who shouted.`,
        then: `JUNIOR WORKED EXAMPLE (opening): "Then…"\n\nDraft: "Then I went home. Then I slept."\n\nRevision: "By midnight I was in bed. My alarm went off at six."\n\nTeaching point: use a time word in the sentence instead of piling "Then".`,
        i: `JUNIOR WORKED EXAMPLE (opening): "I…"\n\nDraft: "I walked in. I saw him. I felt scared."\n\nRevision: "Inside smelled like coffee. He stood by the window. Cold sat in my throat."\n\nTeaching point: mix "I" with smells, sounds, and places.`,
        my: `JUNIOR WORKED EXAMPLE (opening): "My…"\n\nDraft: "My bag was heavy. My phone died."\n\nRevision: "My bag strap dug in; my phone died halfway through the message."\n\nTeaching point: join related "My" ideas into one sentence.`,
        we: `JUNIOR WORKED EXAMPLE (opening): "We…"\n\nDraft: "We went to the park. We ate. We went home."\n\nRevision: "We cut through the park with hot chips, then ran home before the storm."\n\nTeaching point: show one shared moment instead of a list.`,
        suddenly: `JUNIOR WORKED EXAMPLE (opening): "Suddenly…"\n\nDraft: "Suddenly the door opened."\n\nRevision: "The door flew open before anyone knocked."\n\nTeaching point: show the surprise—often you can delete "Suddenly".`
    };

    const OPENING_GENERIC = `WORKED EXAMPLE (opening variety)\n\nToo many sentences start the same way—the word isn’t banned; density is.\n\nTry: time ("By morning…"), place ("Under the bleachers…"), or a concrete subject ("Keys jingled…"). Read first words aloud; vary about one line in three.`;

    const OPENING_GENERIC_JUNIOR = `JUNIOR WORKED EXAMPLE (opening variety)\n\nYou get this flag when too many sentences in one paragraph start the same way. The word is not banned—you just need variety.\n\nTry starting with:\n• a time ("At lunch…")\n• a place ("On the steps…")\n• a thing doing an action ("Keys jingled…")\n\nRead your first words out loud. If they sound the same, change one sentence in three.`;

    const REPETITION_EXAMPLE = `WORKED EXAMPLE (repetition)\n\nDraft: "The classroom was loud. The classroom smelled like wet paint."\n\nRevision: "Noise stacked under the ceiling. Wet paint hung in the air."\n\nTeaching point: repeat on purpose only; otherwise change subject or rephrase.`;

    const REPETITION_JUNIOR = `JUNIOR WORKED EXAMPLE (repetition)\n\nDraft: "The room was loud. The room smelled like paint."\n\nRevision: "Noise bounced off the walls. Wet paint hung in the air. I stayed tense until the bell."\n\nTeaching point: say "the room" once—then noise, smell, body.`;

    function resolveWorkedExample(rawWord, categoryId, opts) {
        const low = rawWord.toLowerCase();
        const phraseKey = rawWord.toLowerCase().trim();
        const isBadStart = opts && opts.isBadStart;
        const level = opts && opts.level === 'junior' ? 'junior' : 'senior';

        function pickFillerModalFilter() {
            let out = pickPerWord(PER_WORD[phraseKey], level) || pickPerWord(PER_WORD[low], level);
            if (out) return out;
            if (level === 'junior') {
                if (categoryId === 'filler') return JUNIOR_GENERIC.filler;
                if (categoryId === 'filter') return JUNIOR_GENERIC.filter;
                if (categoryId === 'modal') return JUNIOR_GENERIC.modal;
            }
            return null;
        }

        if (categoryId === 'frequent') {
            return level === 'junior' ? REPETITION_JUNIOR : REPETITION_EXAMPLE;
        }

        if (categoryId === 'subjective') {
            const sub = pickPerWord(PER_WORD[low], level);
            if (sub) return sub;
            return level === 'junior'
                ? JUNIOR_GENERIC.subjective
                : `WORKED EXAMPLE (subjectivity)\n\nDraft: "I believe the data is wrong."\n\nRevision: "The data conflicts with the 2021 census (methodology, p. 6)."\n\nTeaching point: lead with evidence, not "I believe".`;
        }

        if (isBadStart) {
            if (level === 'junior') {
                return OPENING_JUNIOR[low] || OPENING_GENERIC_JUNIOR;
            }
            return OPENING_EXAMPLES[low] || OPENING_GENERIC;
        }

        if (categoryId === 'glue') {
            const g = classifyGlue(low);
            const glueAtSentenceStart = opts && opts.glueSentenceStart;
            let templateKey = g;
            if (g === 'advglue' && !glueAtSentenceStart) {
                templateKey = 'advglue_mid';
            }
            const body =
                level === 'junior'
                    ? GLUE_TEMPLATES_JUNIOR[templateKey] || GLUE_TEMPLATES_JUNIOR[g] || GLUE_TEMPLATES[templateKey] || GLUE_TEMPLATES[g]
                    : GLUE_TEMPLATES[templateKey] || GLUE_TEMPLATES[g];
            const familyLabel = templateKey.replace(/_/g, ' ');
            return `“${rawWord}” · glue · ${familyLabel}\n\n` + body;
        }

        if (categoryId === 'weak_verbs') {
            const g = classifyWeakVerb(low);
            const body = level === 'junior' ? WEAK_VERB_TEMPLATES_JUNIOR[g] || WEAK_VERB_TEMPLATES[g] : WEAK_VERB_TEMPLATES[g];
            return `“${rawWord}” · weak verb\n\n` + body;
        }

        if (categoryId === 'basic') {
            const g = BASIC_TO_GROUP[low] || 'generic';
            const body = level === 'junior' ? BASIC_TEMPLATES_JUNIOR[g] || BASIC_TEMPLATES[g] : BASIC_TEMPLATES[g];
            return `“${rawWord}” · basic word\n\n` + body;
        }

        if (categoryId === 'adverb') {
            const tpl = level === 'junior' ? ADVERB_MASTER_JUNIOR : ADVERB_MASTER;
            return tpl.replace(/\{\{WORD\}\}/g, rawWord);
        }

        if (categoryId === 'cliche') {
            const cl = pickPerWord(PER_WORD[phraseKey], level) || pickPerWord(PER_WORD[low], level);
            if (cl) return cl;
            return level === 'junior'
                ? JUNIOR_GENERIC.cliche
                : `WORKED EXAMPLE (cliché)\n\nDraft: "It was a dark and stormy night."\n\nRevision: "Rain hammered the roof until talk became shouting."\n\nTeaching point: swap the stock phrase for one image from your scene.`;
        }

        if (categoryId === 'filler' || categoryId === 'filter' || categoryId === 'modal') {
            const fm = pickFillerModalFilter();
            if (fm) return fm;
            return (
                `“${rawWord}” · ${categoryId}\n\n` +
                    `Swap vague softeners for evidence, action, or a sharper verb. Delete once and read aloud—if meaning collapses, add specifics (numbers, names, texture), not just a synonym.`
            );
        }

        const catchAll = pickPerWord(PER_WORD[phraseKey], level) || pickPerWord(PER_WORD[low], level);
        if (catchAll) return catchAll;

        return level === 'junior'
            ? JUNIOR_GENERIC.default
            : `“${rawWord}”\n\nTry evidence, action, or a precise noun. Keep the word if it’s only doing grammar—just don’t let it cluster.`;
    }

    global.LAB = {
        SOPHISTICATED_LEXICON,
        SOPHISTICATED_EXCLUDE,
        buildWeakTokenSetFromLists,
        countSophisticatedDistinct,
        resolveWorkedExample,
        classifyGlue,
        classifyWeakVerb,
        REPETITION_EXAMPLE
    };
})(typeof window !== 'undefined' ? window : this);
