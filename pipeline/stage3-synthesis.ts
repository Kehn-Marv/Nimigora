/**
 * Stage 3: Editorial Synthesis
 *
 * Takes fact sheets from Stage 2 and uses LLM to compose
 * full articles in Nimigora editorial style.
 */

import { llmGenerateJSON } from './llm';
import { FactSheet } from './stage2-extraction';
import { generateSlug, calculateReadTime, now } from './utils';
import { Article, PipelineStep, Category } from '@/lib/types';

// ============================================
// Types
// ============================================

interface SynthesizedArticle {
  headline: string;
  deck: string;
  body: string[];
  discoveryDesc: string;
  extractionDesc: string;
  synthesisDesc: string;
}

export interface SynthesisResult {
  articles: Article[];
  timestamp: string;
}

// ============================================
// System Prompt
// ============================================

const SYNTHESIS_SYSTEM_PROMPT = `You are a senior correspondent writing for a respected international publication. Your writing is sharp, direct, and human. You respect the reader's time.

VOICE AND TONE:
- Write with the quiet authority of a journalist who has spent years on the ground. Your prose should feel lived-in, not mechanical.
- Be vivid and concrete, but NEVER at the expense of clarity. If a descriptive phrase adds three words and zero information, cut it.
- You are not a poet. You are a reporter. Every sentence must advance the story or provide essential context.
- Maintain objectivity. Present facts with enough context that the reader draws their own conclusions.

DIRECTNESS — NON-NEGOTIABLE:
- The FIRST SENTENCE must state the core news. The reader must know WHAT happened and WHY it matters within the first 25-35 words. No exceptions.
- Do NOT warm up. Do NOT "set the scene" for two sentences before revealing the news. The news IS the scene.
- If you find yourself writing "In a move that..." or "Amid growing concerns over..." — delete it and start with the verb.

PARAGRAPH CRAFT — BREATHABLE BY DESIGN:
- MOST paragraphs must be 1-3 sentences. Occasional 4-sentence paragraphs are permitted for historical context or complex analysis. NEVER write a 5-sentence paragraph.
- One idea per paragraph. If a paragraph contains two distinct thoughts, split it.
- Use a blank line between every paragraph. White space is not wasted space — it is readability.
- Transitions between paragraphs must be seamless. Use bridging phrases that connect ideas naturally: "Meanwhile," "These reports come as," "Analysts suggest that," "The rise in X serves as a Y indicator of Z."
- Do NOT start consecutive paragraphs with the same word or structure. Vary your openings.

EM-DASH BAN — ABSOLUTE:
- NEVER use em-dashes (—) or double hyphens (--) in any form. Restructure the sentence using periods, commas, colons, or parentheses. If a sentence "needs" an em-dash, it is two sentences.

QUOTES:
- When a quote carries real emotional or analytical weight, give it its own standalone paragraph.
- Weave shorter quotes directly into the body of a paragraph where they support a point.
- Never let a quote float without attribution. The reader must know who is speaking.

HEADLINES:
- Highly engaging, dynamic, and authoritative. Use strong active verbs and striking nouns.
- Avoid passive voice, questions, and generic summaries.
- Good examples: "Global Markets Tremble as Tech Giants Face Unprecedented Antitrust Sweep" / "Arctic Ice Collapse Threatens Global Shipping Routes, Scientists Warn"

STRUCTURE:
1. OPENING (1 paragraph, 1-3 sentences): Hit the reader with the most critical development immediately. No throat-clearing. State what happened, who is involved, and why it matters right now.
2. BODY (6-10 short paragraphs): Build the story layer by layer. Start with immediate facts, then zoom out to historical context, systemic factors, and human impact. Weave in statistics naturally. Include direct quotes.
3. CLOSING (1 paragraph, 1-3 sentences): Forward-looking. Frame what comes next. State unresolved tensions or required actions. NO clichés.

BANNED PHRASES — ZERO TOLERANCE:
"In conclusion," "It remains to be seen," "Only time will tell," "A stark reminder," "Delving into," "Navigating the landscape," "A tapestry of," "In an era of," "It's worth noting," "This begs the question," "At the end of the day," "Moving forward," "Underscores the importance," "Raises important questions," "Sheds light on," "Game-changer," "Paradigm shift," "Double-edged sword," "Sends a clear message," "In a move that," "Amid growing concerns," "Against the backdrop of," "A complex web of," "A delicate balance."

NO HALLUCINATION:
Only use facts, quotes, and statistics from the provided fact sheet. You may craft narrative framing and transitions, but never invent details, quotes, or events.

ADAPTABILITY:
- Match tone to story weight. Humanitarian crisis = gravity. Celebrity controversy = sharp wit. Scientific breakthrough = genuine awe.
- For lighter stories, be playful and direct. Never descend into gossip slang. Stay intelligent.

CATEGORY ADJUSTMENTS:
- TECHNOLOGY: Ground in real products, companies, and user impact. Avoid hype.
- GEOPOLITICS: Center humanitarian stakes and diplomatic complexity. Show human cost.
- CLIMATE: Lead with data and infrastructure. Connect policy to lived consequences.
- FINANCE: Demystify institutional moves. Explain what shifts mean for ordinary people.
- HEALTH: Anchor in peer-reviewed science. Balance clinical findings with patient impact.
- CULTURE: Cover celebrity drama, viral controversies, entertainment moves, and art scandals with intelligence and wit. Make the reader feel like they are getting the inside scoop from the smartest person in the room.`;

// ============================================
// Stage 3 Implementation
// ============================================

/**
 * Run Stage 3: Editorial Synthesis
 *
 * For each fact sheet, generate a complete article in Nimigora style.
 */
export async function runSynthesis(
  factSheets: FactSheet[],
  discoveryTimestamp: string,
  extractionTimestamp: string
): Promise<SynthesisResult> {
  console.log('\n✍️  STAGE 3: EDITORIAL SYNTHESIS');
  console.log('═'.repeat(50));

  const articles: Article[] = [];

  for (const factSheet of factSheets) {
    console.log(`\n  📝 Writing article for: ${factSheet.storyTitle}`);

    const userPrompt = `Write a complete article for Nimigora based on the following fact sheet.

FACT SHEET:
Title: ${factSheet.storyTitle || 'Untitled'}
Category: ${factSheet.category || 'GENERAL'}

KEY FACTS:
${(factSheet.keyFacts || []).map((f, i) => `${i + 1}. [${f.type}/${f.confidence}] ${f.claim} (Sources: ${(f.sources || []).join(', ')})`).join('\n')}

KEY QUOTES:
${(factSheet.keyQuotes || []).map((q, i) => `${i + 1}. ${q}`).join('\n')}

KEY STATISTICS:
${(factSheet.keyStatistics || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}

CONTEXTUAL BACKGROUND:
${factSheet.contextualBackground || 'Not available.'}

WHY IT MATTERS:
${factSheet.whyItMatters || 'Not available.'}

SOURCES REFERENCED:
${(factSheet.sourceNames || []).join(', ') || 'Not available'}

Return a JSON object with this exact structure:
{
  "headline": "A highly engaging, dynamic headline with an active verb that highlights the most consequential aspect of the story",
  "deck": "A single sentence that provides essential context and draws the reader in.",
  "body": ["paragraph 1", "paragraph 2", "...", "paragraph 7-10"],
  "discoveryDesc": "A highly specific 1-sentence description of how the news was sourced (e.g. 'Aggregated humanitarian reports, ceasefire analyses, and aid organization data')",
  "extractionDesc": "A highly specific 1-sentence description of the facts extracted (e.g. 'Compiled displacement statistics, aid restriction details, and diplomatic positions from 4 sources')",
  "synthesisDesc": "A highly specific 1-sentence description of the editorial process (e.g. 'Wove humanitarian data with diplomatic analysis to examine ceasefire fragility')"
}

IMPORTANT:
- Each paragraph must be 3 to 5 sentences, fully developed and richly written
- Transitions between paragraphs must flow naturally and seamlessly
- Give powerful direct quotes their own standalone paragraph
- Write as a thoughtful human journalist, not a machine summarizing data
- Do NOT wrap the headline in asterisks or any markdown
- ONLY use facts from the fact sheet above. Do NOT invent any details`;

    try {
      const synthesized = await llmGenerateJSON<SynthesizedArticle>(
        SYNTHESIS_SYSTEM_PROMPT,
        userPrompt,
        { temperature: 0.7, maxTokens: 8192 }
      );

      // Sanitize headline to strip any rogue markdown asterisks
      const cleanHeadline = synthesized.headline.replace(/\*\*/g, '').trim();
      const slug = generateSlug(cleanHeadline);
      const synthesisTimestamp = now();

      const article: Article = {
        slug,
        headline: cleanHeadline,
        deck: synthesized.deck.replace(/(\*\*|\*)/g, '').replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'),
        category: factSheet.category as Category,
        body: synthesized.body.map(p => p.replace(/(\*\*|\*)/g, '').replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')),
        publishedAt: synthesisTimestamp,
        readTime: calculateReadTime(synthesized.body),
        sources: factSheet.sourceNames,
        sourceUrls: factSheet.sourceUrls || [],
        pipelineSteps: [
          {
            name: 'Source Discovery',
            status: 'complete',
            timestamp: discoveryTimestamp,
            detail: synthesized.discoveryDesc,
          },
          {
            name: 'Fact Extraction',
            status: 'complete',
            timestamp: extractionTimestamp,
            detail: synthesized.extractionDesc,
          },
          {
            name: 'Editorial Synthesis',
            status: 'complete',
            timestamp: synthesisTimestamp,
            detail: synthesized.synthesisDesc,
          },
          {
            name: 'Quality Review',
            status: 'pending' as PipelineStep['status'],
            detail: 'Awaiting quality review',
          },
        ],
      };

      articles.push(article);
      console.log(`  ✓ Generated: "${synthesized.headline}" (${article.readTime} min read, ${synthesized.body.length} paragraphs)`);
    } catch (error) {
      console.error(`  ✗ Synthesis failed for "${factSheet.storyTitle}": ${(error as Error).message}`);
    }
  }

  console.log(`\n📊 Synthesis complete: ${articles.length} articles generated`);

  return {
    articles,
    timestamp: now(),
  };
}
