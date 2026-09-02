export type AnswerType = "type" | "fill-blank" | "true-false" | "multiple-choice" | "explain";

export interface StudyCard {
  id: string;
  front: string;
  back: string;
  answerType: AnswerType;
  choices?: string[];
  blankSentence?: string;
  trueFalseStatement?: string;
  trueFalseAnswer?: boolean;
  explanation: string;
  realWorldConnection: string;
  tokConnection: string;
  interdisciplinary: string;
  inquiryQuestion: string;
  exampleSentence?: string;
  imageUrl?: string;
  audioLang: string;
  subject: "spanish" | "biology" | "english" | "math";
  topic?: string;
  // SM-2 state
  easiness: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
}

export const MAX_SESSION_SIZE = 20;

export const SAMPLE_CARDS: StudyCard[] = [
  // ===== MATH - Absolute Value Functions =====
  {
    id: "m01", front: "What is the parent absolute value function?", back: "f(x) = |x|",
    answerType: "type", imageUrl: "/math/abs-parent.svg",
    explanation: "The parent absolute value function is f(x) = |x|. It creates a V-shape because absolute value makes all outputs positive — negative inputs get 'flipped' up.",
    realWorldConnection: "GPS uses absolute value to calculate distance — whether you drive 3 miles east or 3 miles west, the distance is still 3 miles.",
    tokConnection: "How do mathematicians decide which function is the 'parent'? Is this a discovery or an invention — did humans create absolute value or find it in nature?",
    interdisciplinary: "Physics: absolute value describes magnitude of vectors (speed vs velocity). In English, 'absolute' means unconditional — how does that connect to the math meaning?",
    inquiryQuestion: "Can you think of a situation where knowing the direction matters MORE than just the distance? When would absolute value lose important information?",
    audioLang: "en-US", subject: "math", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "m02", front: "What is vertex form of an absolute value function?", back: "g(x) = a|x - h| + k",
    answerType: "type", imageUrl: "/math/abs-vertex-form.svg",
    explanation: "Vertex form g(x) = a|x - h| + k gives you the vertex (h, k) directly. 'a' controls how wide/narrow and whether it opens up or down.",
    realWorldConnection: "A roof's peak is like a vertex — the slope (a) determines steepness, and (h, k) locates where the peak sits on the house.",
    tokConnection: "Why do mathematicians create multiple 'forms' for the same function? What does each form reveal that the others hide?",
    interdisciplinary: "Architecture: architects use vertex calculations to design arches and roof peaks. Art: the golden ratio uses similar transformations to create pleasing proportions.",
    inquiryQuestion: "If you could only give someone ONE piece of information about an absolute value graph, would you give them the vertex or the slope? Why?",
    audioLang: "en-US", subject: "math", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "m03", front: "In g(x) = a|x - h| + k, what does 'h' do?", back: "horizontal translation",
    answerType: "multiple-choice", imageUrl: "/math/abs-h-shift.svg",
    choices: ["horizontal translation", "vertical translation", "reflection", "stretch"],
    explanation: "'h' shifts the graph left or right. If h = 2, the graph moves 2 units RIGHT (note: it's x - h, so x - 2 moves right). Think: h is 'hiding' inside the subtraction.",
    realWorldConnection: "Like sliding an app icon left or right on your phone screen — the shape doesn't change, just its horizontal position.",
    tokConnection: "Why does x - 2 move the graph RIGHT instead of left? Our intuition says 'minus = left', but math says otherwise. How do we resolve conflicts between intuition and proof?",
    interdisciplinary: "Music: transposing a song to a different key is a 'horizontal shift' — same melody, different starting position. Biology: circadian rhythms can 'shift' when you travel across time zones.",
    inquiryQuestion: "If every student in class shifted their desk 2 feet right, does the classroom 'change'? What's preserved and what's different? How is this like a graph translation?",
    audioLang: "en-US", subject: "math", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "m04", front: "In g(x) = a|x - h| + k, what does 'k' do?", back: "vertical translation",
    answerType: "multiple-choice", imageUrl: "/math/abs-k-shift.svg",
    choices: ["vertical translation", "horizontal translation", "vertical stretch", "reflection"],
    explanation: "'k' shifts the entire graph up (positive k) or down (negative k). It's added OUTSIDE the absolute value, so it directly changes y-values.",
    realWorldConnection: "Like adjusting the height of a basketball hoop — the V-shape of the net stays the same, just moves up or down.",
    tokConnection: "We say 'k shifts the graph up.' But does the graph actually move, or does our coordinate system change perspective? Is motion relative in math like it is in physics?",
    interdisciplinary: "Economics: adding a flat tax to every purchase is a 'vertical shift' of a price function. Spanish: 'subir' (to go up) and 'bajar' (to go down) — vertical translation in everyday language.",
    inquiryQuestion: "Sea level is rising. Is that a vertical shift of the ocean's 'graph', or a vertical shift of the land's 'graph'? Does it matter which perspective you take?",
    audioLang: "en-US", subject: "math", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "m05", front: "A negative 'a' in g(x) = a|x| reflects the graph over the x-axis.", back: "true",
    answerType: "true-false", imageUrl: "/math/abs-reflection.svg",
    trueFalseStatement: "A negative 'a' in g(x) = a|x| reflects the graph over the x-axis.",
    trueFalseAnswer: true,
    explanation: "When a < 0, all y-values become negative, flipping the V-shape upside down. g(x) = -|x| opens downward like an upside-down V.",
    realWorldConnection: "Think of a mountain reflected in a lake — the peak becomes a valley. Same shape, flipped vertically.",
    tokConnection: "A reflection creates a mirror image. Is a reflection the 'same' object or a 'different' object? How do we define mathematical identity?",
    interdisciplinary: "Biology: DNA has complementary strands that are 'reflections' of each other. Art: symmetry and reflection are foundational principles in visual design.",
    inquiryQuestion: "If you flip a smile upside down, it becomes a frown. What real-world functions would be 'bad' if reflected? (Hint: think about profit vs loss graphs)",
    audioLang: "en-US", subject: "math", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "m06", front: "If |a| > 1 in g(x) = a|x|, the graph becomes ___.", back: "narrower",
    answerType: "fill-blank", imageUrl: "/math/abs-stretch-shrink.svg",
    blankSentence: "If |a| > 1 in g(x) = a|x|, the graph becomes ___ (a vertical stretch).",
    explanation: "When |a| > 1, each y-value is multiplied by a number greater than 1, making the graph taller and narrower. Example: 2|x| rises twice as fast as |x|.",
    realWorldConnection: "Like zooming in on a photo vertically — the image stretches taller and appears narrower.",
    tokConnection: "We call |a| > 1 a 'stretch' but visually it looks 'narrower.' Language and perception conflict here. Should math terms match visual intuition or logical precision?",
    interdisciplinary: "Biology: growth hormones cause vertical stretch in bones. Economics: inflation 'stretches' prices — same goods, bigger numbers.",
    inquiryQuestion: "A 2x zoom on your camera makes things look bigger but shows less area. What's the tradeoff when you 'stretch' a mathematical function? What information gets emphasized vs hidden?",
    audioLang: "en-US", subject: "math", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "m07", front: "What is the vertex of f(x) = |x - 3| + 2?", back: "(3, 2)",
    answerType: "type",
    explanation: "In vertex form g(x) = a|x - h| + k, the vertex is (h, k). Here h = 3 and k = 2, so vertex = (3, 2). Remember: h has opposite sign from what's inside.",
    realWorldConnection: "Like finding the exact location of a mountain peak on a map — (3, 2) means 3 units right and 2 units up from the origin.",
    tokConnection: "We 'read' the vertex from the equation without graphing. Is algebraic reasoning more reliable than visual graphing? When might each method be better?",
    interdisciplinary: "Geography: coordinates (latitude, longitude) locate any point on Earth the same way (h, k) locates a vertex. Spanish: '¿Dónde está?' (Where is it?) — location is universal across languages.",
    inquiryQuestion: "If two different equations have the same vertex, are their graphs identical? What else would you need to know to fully determine the graph?",
    audioLang: "en-US", subject: "math", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },

  // MATH - Polynomials
  {
    id: "m11", front: "Which of these is NOT a monomial: 3x², 5+x, -7y⁵, 12?", back: "5+x",
    answerType: "multiple-choice",
    choices: ["5+x", "3x²", "-7y⁵", "12"],
    explanation: "5+x has TWO terms (it's a binomial). A monomial is a single term — a number, variable, or product of numbers and variables. 3x², -7y⁵, and 12 are all single terms.",
    realWorldConnection: "The area of a square (s²) is a monomial. The perimeter of a rectangle (2l + 2w) is NOT — it has two terms. Recognizing this tells you which formulas simplify easily.",
    tokConnection: "Mathematicians defined monomials by what they EXCLUDE (no addition, no variables in denominators). Is defining something by what it's NOT a valid way of knowing?",
    interdisciplinary: "English: 'monologue' = one person speaking (mono = one). Biology: 'monocot' = one seed leaf. The prefix 'mono-' means the same thing across every subject.",
    inquiryQuestion: "Is the number 0 a monomial? What about 0x²? Does multiplying by zero change the classification?",
    audioLang: "en-US", subject: "math", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "m12", front: "What is the degree of 4x³y²?", back: "5",
    answerType: "type",
    explanation: "Degree = sum of ALL variable exponents. Here: 3 (from x³) + 2 (from y²) = 5. The coefficient (4) doesn't count toward degree.",
    realWorldConnection: "Degree tells you how fast a function grows. A degree-5 term grows explosively compared to degree-2. In physics, higher-degree equations model more complex real-world motion.",
    tokConnection: "We sum exponents to get degree. Why addition and not multiplication? This is a CONVENTION — mathematicians agreed on it because it's useful for classification, not because nature demands it.",
    interdisciplinary: "Biology: taxonomy classifies organisms by layers (kingdom → species). Math classifies polynomials by degree. Both are hierarchical systems humans impose to organize complexity.",
    inquiryQuestion: "The degree of a constant (like 7) is 0. Does that feel right intuitively? Why would 'no variable' count as degree zero instead of 'no degree'?",
    audioLang: "en-US", subject: "math", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "m13", front: "Classify this polynomial by number of terms: x² + 5x + 2", back: "trinomial",
    answerType: "multiple-choice",
    choices: ["trinomial", "monomial", "binomial", "polynomial"],
    explanation: "Count the terms separated by + or -: x², 5x, and 2 = three terms = trinomial. Mono=1, Bi=2, Tri=3. All of these are also 'polynomials' but trinomial is more specific.",
    realWorldConnection: "Trinomials are what you factor in algebra: x² + 5x + 6 = (x+2)(x+3). Recognizing 'this is a trinomial' immediately tells you WHICH factoring method to try.",
    tokConnection: "After trinomial (3), we stop naming and just say 'polynomial.' Why does math stop creating specific names? Is there a cognitive limit to how many categories are useful?",
    interdisciplinary: "Music: monophony (1 voice), polyphony (many voices). Language: monolingual, bilingual, trilingual, then just 'multilingual.' Every field hits a naming ceiling.",
    inquiryQuestion: "Is x² + 3x + 2 + 0x³ a trinomial or a 4-term polynomial? Does a term with coefficient 0 'count'?",
    audioLang: "en-US", subject: "math", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "m14", front: "Write 15x - x³ + 3 in standard form.", back: "-x³ + 15x + 3",
    answerType: "type", imageUrl: "/math/polynomials.svg",
    explanation: "Standard form = terms ordered by DECREASING degree. x³ is degree 3 (highest, goes first), 15x is degree 1, 3 is degree 0 (constant, goes last). The negative stays with x³.",
    realWorldConnection: "Standard form is like alphabetical order for polynomials — everyone agrees on one way to write them so we can compare and communicate clearly.",
    tokConnection: "Rearranging terms doesn't change the polynomial's VALUE — just its appearance. Standard form is a convention for communication, not a mathematical necessity. What other conventions exist purely for clarity?",
    interdisciplinary: "English: essays follow a standard structure (intro → body → conclusion). History: standardization (like time zones) required international agreement. Standards are social contracts.",
    inquiryQuestion: "If two students write the same polynomial in different orders, are they 'wrong'? Standard form isn't mathematically required — it's a communication choice. When does convention become rule?",
    audioLang: "en-US", subject: "math", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },

  // ===== BIOLOGY =====
  {
    id: "b01", front: "What are the 7 characteristics of living organisms? (MRS GREN)", back: "movement, respiration, sensitivity, growth, reproduction, excretion, nutrition",
    answerType: "type",
    explanation: "MRS GREN: Movement, Respiration, Sensitivity, Growth, Reproduction, Excretion, Nutrition. ALL 7 must be present for something to be considered alive.",
    realWorldConnection: "Is fire alive? It grows, moves, and 'respires' (needs oxygen) — but it can't reproduce or excrete, so it's NOT alive.",
    tokConnection: "We defined life with 7 criteria. But viruses meet SOME criteria (reproduce, evolve) but not others (no respiration). Does our definition create the boundary, or reveal it?",
    interdisciplinary: "Philosophy: 'What is life?' is one of the oldest philosophical questions. English: Mary Shelley's Frankenstein explores what happens when we CREATE life that meets these criteria artificially.",
    inquiryQuestion: "If scientists build a robot that moves, senses, grows (learns), and reproduces (builds copies), is it alive? Which criteria truly separate living from non-living?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b02", front: "What is excretion?", back: "removal of waste products made by chemical reactions in cells",
    answerType: "type",
    explanation: "Excretion is NOT the same as egestion (pooping). Excretion specifically means removing waste from CHEMICAL REACTIONS — like CO₂ from respiration or urea from protein breakdown.",
    realWorldConnection: "When you breathe out CO₂ or sweat out salt — that's excretion. Your body is taking out its metabolic 'trash'.",
    tokConnection: "We distinguish excretion from egestion based on WHERE the waste came from. How important are precise definitions in science? Can imprecise language lead to wrong conclusions?",
    interdisciplinary: "Environmental Science: factories 'excrete' pollution as a byproduct of chemical processes. Economics: waste management is a billion-dollar industry built around excretion at every scale.",
    inquiryQuestion: "If a cell couldn't excrete, what would happen to it? How is this similar to what happens when a city's sewage system fails?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b03", front: "Respiration only happens in animals, not plants.", back: "false",
    answerType: "true-false",
    trueFalseStatement: "Respiration only happens in animals, not plants.",
    trueFalseAnswer: false,
    explanation: "ALL living organisms respire — including plants! Plants do photosynthesis AND respiration. Respiration happens 24/7; photosynthesis only in light.",
    realWorldConnection: "Plants need energy too — at night when there's no sunlight for photosynthesis, they rely entirely on respiration, just like you.",
    tokConnection: "This is a common misconception. Why do people believe plants don't respire? How do oversimplified models (plants = photosynthesis, animals = respiration) create false knowledge?",
    interdisciplinary: "History of Science: it took centuries to discover plant respiration because scientists assumed plants were 'opposite' to animals. English: the word 'respire' comes from Latin 're-spirare' (to breathe again).",
    inquiryQuestion: "If plants both photosynthesize AND respire, do they produce more O₂ than they consume? What would happen to Earth's atmosphere if the balance shifted?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b04", front: "The ___ controls cell activities and contains DNA.", back: "nucleus",
    answerType: "fill-blank",
    blankSentence: "The ___ controls cell activities and contains DNA.",
    explanation: "The nucleus is the 'brain' of the cell. It holds DNA (genetic instructions) and controls what proteins the cell makes, which determines what the cell does.",
    realWorldConnection: "The nucleus is like the principal's office of a school — it holds all the important blueprints and sends instructions to every department.",
    tokConnection: "We call the nucleus the 'control center.' But does DNA actually 'control' anything, or does it just store information that other parts read? Is a library a 'control center' of knowledge?",
    interdisciplinary: "Computer Science: the nucleus is like a hard drive (stores code/DNA) while ribosomes are like the CPU (execute the instructions). Spanish: 'núcleo' means core/center in both science and everyday Spanish.",
    inquiryQuestion: "Red blood cells have NO nucleus. How do they function without DNA? What does this tell us about the relationship between information storage and function?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b05", front: "What is the function of chloroplasts?", back: "where photosynthesis takes place",
    answerType: "multiple-choice",
    choices: ["where photosynthesis takes place", "where respiration takes place", "stores water and nutrients", "controls what enters the cell"],
    explanation: "Chloroplasts contain chlorophyll (green pigment) that absorbs light energy and converts CO₂ + water into glucose + oxygen. Only found in PLANT cells.",
    realWorldConnection: "Chloroplasts are like tiny solar panels inside plant cells — they capture sunlight and convert it into usable energy (food).",
    tokConnection: "Chloroplasts have their own DNA, separate from the nucleus. Scientists believe they were once independent bacteria that merged with ancient cells (endosymbiosis). How does this change what we mean by 'one organism'?",
    interdisciplinary: "Engineering: solar panel designers study chloroplasts to improve efficiency. Math: photosynthesis rate can be modeled as a function of light intensity — an absolute value problem with constraints!",
    inquiryQuestion: "Chloroplasts are only ~1% efficient at converting light to chemical energy. Solar panels are ~20%. Why hasn't evolution produced more efficient photosynthesis in billions of years?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b06", front: "What are the levels of organisation from smallest to largest?", back: "organelles, cells, tissues, organs, organ systems",
    answerType: "type",
    explanation: "Think of it like building a house: bricks (organelles) → rooms (cells) → floors (tissues) → buildings (organs) → a whole neighborhood (organ system).",
    realWorldConnection: "Your heart is an organ made of muscle tissue, which is made of muscle cells, which contain organelles like mitochondria for energy.",
    tokConnection: "We impose levels of organization on biology. But nature doesn't label things 'tissue' or 'organ.' Are these categories real, or just useful tools for human understanding?",
    interdisciplinary: "English: essays have similar levels (words → sentences → paragraphs → sections → chapters). Sociology: individuals → families → communities → societies. Hierarchical organization appears everywhere.",
    inquiryQuestion: "At what point does a collection of cells become a 'tissue'? Is there a sharp boundary, or is it gradual? How do scientists decide where one level ends and another begins?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b07", front: "The cell wall is made of ___.", back: "cellulose",
    answerType: "fill-blank",
    blankSentence: "The cell wall in plant cells is made of ___.",
    explanation: "Cellulose is a tough, rigid carbohydrate that gives plant cells their fixed shape. Animal cells DON'T have a cell wall — that's why animal cells can be different shapes.",
    realWorldConnection: "Cellulose is in paper, cotton, and wood. When you write on paper, you're writing on flattened plant cell walls!",
    tokConnection: "Cellulose is the most abundant organic molecule on Earth, yet humans can't digest it. Cows can (with bacterial help). Does this mean 'food' is defined by the organism, not the molecule?",
    interdisciplinary: "History: the invention of paper (cellulose) transformed human civilization. Economics: the lumber, cotton, and paper industries are all built on one molecule.",
    inquiryQuestion: "If scientists could engineer human gut bacteria to digest cellulose, we could eat grass and leaves. Would this solve world hunger? What might go wrong?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b08", front: "Which organelle is called the 'powerhouse of the cell'?", back: "mitochondria",
    answerType: "multiple-choice",
    choices: ["mitochondria", "nucleus", "chloroplast", "ribosome"],
    explanation: "Mitochondria perform aerobic respiration: glucose + oxygen → CO₂ + water + ATP (energy). More active cells (like muscle) have MORE mitochondria.",
    realWorldConnection: "Mitochondria are like power plants in a city — they burn fuel (glucose) to produce electricity (ATP) that powers everything the cell does.",
    tokConnection: "Mitochondria have their own DNA and reproduce independently inside cells. If they were once separate organisms, do 'you' include your mitochondria? Where does 'self' begin and end?",
    interdisciplinary: "Physics: energy conservation (1st law of thermodynamics) applies here — mitochondria don't CREATE energy, they CONVERT it. Math: ATP production can be modeled with exponential functions.",
    inquiryQuestion: "You inherit mitochondrial DNA only from your mother. Scientists use this to trace human ancestry. What does this tell us about knowledge — can biology answer historical questions?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },

  // ===== BIOLOGY - Section 8: Ecology and the Environment =====
  {
    id: "b10", front: "What term describes the variety of different species living in an area?", back: "biodiversity",
    answerType: "type",
    explanation: "Biodiversity = bio (life) + diversity (variety). It measures the number of DIFFERENT species in a habitat, not just the total number of organisms. High biodiversity = healthy ecosystem.",
    realWorldConnection: "The Amazon rainforest has the highest biodiversity on Earth — one tree can host 100+ species of insects. Deforestation reduces biodiversity permanently.",
    tokConnection: "We measure biodiversity by counting species. But what IS a species? The boundary between species is blurry (ring species, hybridization). Does our definition of 'species' create biodiversity or just measure it?",
    interdisciplinary: "Economics: biodiversity has monetary value — medicines, crops, and materials come from diverse species. Math: the Simpson's Diversity Index quantifies biodiversity with a formula. Ethics: do all species have equal 'right' to exist?",
    inquiryQuestion: "If we could save only 100 species from extinction, how would you choose which ones? By usefulness to humans? By uniqueness? By beauty? What values drive conservation?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b11", front: "What is a habitat?", back: "the place where an organism lives",
    answerType: "multiple-choice",
    choices: ["the place where an organism lives", "all the organisms in an area", "the role an organism plays in its ecosystem", "the variety of species in an area"],
    explanation: "Habitat = the physical environment. A pond is a habitat. A coral reef is a habitat. Don't confuse with niche (the organism's role) or community (all the organisms together).",
    realWorldConnection: "Your bedroom is YOUR habitat — it has specific conditions (temperature, light, resources) that make it suitable for you. A polar bear's habitat provides completely different conditions.",
    tokConnection: "Humans can modify their habitat (heating, AC, farming) unlike any other species. Does this mean we don't truly HAVE a natural habitat anymore? Have we escaped ecological constraints?",
    interdisciplinary: "Geography: habitats map onto climate zones and biomes. Architecture: human buildings are artificial habitats designed for specific activities. Spanish: 'hábitat' is the same word — Latin root 'habitare' (to dwell).",
    inquiryQuestion: "Mars has no habitat suitable for humans. If we terraform it, is it a 'habitat' or something else? At what point does engineering become ecology?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b12", front: "What word describes ALL the different species living together in a habitat?", back: "community",
    answerType: "fill-blank",
    blankSentence: "All the different species living together in a habitat make up a ___.",
    explanation: "Community = ALL species in a habitat interacting together (plants + animals + fungi + bacteria). Population = just ONE species. Ecosystem = community + its physical environment.",
    realWorldConnection: "Your school is a community — students, teachers, janitors, cafeteria workers all interact. In biology, a pond community includes fish, algae, insects, bacteria — everything living there.",
    tokConnection: "The word 'community' implies interaction and interdependence. But do organisms in a habitat KNOW they're part of a community? Is 'community' a real thing or just a label humans impose on collections of organisms?",
    interdisciplinary: "Sociology: human communities share resources and have roles — exactly like ecological communities. English: the metaphor of 'food web' reveals how literary devices help us understand science.",
    inquiryQuestion: "Online communities exist without shared physical habitat. Can we apply ecological concepts (competition, mutualism, parasitism) to social media platforms?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b13", front: "Why must quadrats be placed randomly when sampling organisms in a field?", back: "to avoid bias and make results representative of the whole area",
    answerType: "type",
    explanation: "If you choose where to place quadrats, you might unconsciously pick spots with more (or fewer) organisms. Random placement ensures your sample fairly represents the entire field.",
    realWorldConnection: "This is the same reason political polls use RANDOM samples of voters — if you only poll people at a university, you get biased results that don't represent the whole population.",
    tokConnection: "True randomness is hard to achieve. Humans think they're being 'random' but actually show patterns (avoiding edges, clustering). Does using a random number generator make the science more 'objective' than human judgment?",
    interdisciplinary: "Math: random sampling is the foundation of statistics. Psychology: confirmation bias makes humans see patterns in random data. Technology: random number generators are used in encryption, games, and scientific simulations.",
    inquiryQuestion: "If a student's random quadrats all land in one corner by chance, the results would be unrepresentative. How many samples do you need before randomness 'works'? Is there a mathematical answer?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b14", front: "In the food chain algae → limpet → crab → seagull, which organism is the secondary consumer?", back: "crab",
    answerType: "multiple-choice",
    choices: ["crab", "limpet", "seagull", "algae"],
    explanation: "Producer = algae. Primary consumer = limpet (eats the producer). Secondary consumer = crab (eats the primary consumer). Tertiary consumer = seagull (eats the secondary consumer).",
    realWorldConnection: "At a restaurant, YOU are usually a secondary or tertiary consumer — you eat chicken (primary consumer of grain) or fish (which ate smaller fish which ate plankton).",
    tokConnection: "We label organisms 'primary/secondary/tertiary' consumers. But many animals eat at MULTIPLE levels (bears eat berries AND fish). Do our labels oversimplify reality for the sake of understanding?",
    interdisciplinary: "Economics: supply chains have similar levels (raw materials → manufacturer → distributor → retailer → consumer). Math: each trophic level can be modeled as ~10% of the previous — a geometric sequence.",
    inquiryQuestion: "Humans are omnivores who eat at every trophic level. Are we primary consumers when eating salad and tertiary consumers when eating tuna? Can one organism BE multiple levels simultaneously?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b15", front: "What are decomposers?", back: "microorganisms that break down dead organic material",
    answerType: "type",
    explanation: "Decomposers (bacteria and fungi) break down dead organisms and waste, returning nutrients to the soil. Without them, dead material would pile up and nutrients would be locked away forever.",
    realWorldConnection: "Compost bins work because decomposers break down food scraps into soil. Without decomposers, every leaf that ever fell would still be lying on the ground — the world would be buried in dead stuff.",
    tokConnection: "We call decomposers 'nature's recyclers.' But they're not consciously recycling — they're just eating. Is it accurate to describe unconscious processes with human-intention words like 'recycling'?",
    interdisciplinary: "Economics: waste management companies are society's 'decomposers.' Chemistry: decomposition is a chemical reaction (breaking complex molecules into simpler ones). The word works in both chemistry and biology.",
    inquiryQuestion: "Plastic doesn't decompose because no microorganism has evolved to eat it (it's too new). Scientists are engineering bacteria that CAN. Is this solving a problem or creating a new one?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b16", front: "What happens to the concentration of toxins like DDT as you move UP a food chain?", back: "it increases at each trophic level",
    answerType: "fill-blank",
    blankSentence: "The concentration of toxins like DDT ___ at each trophic level (bioaccumulation).",
    explanation: "Bioaccumulation: DDT doesn't break down, so each organism stores it. A top predator eats MANY prey, accumulating ALL their DDT. Algae had 0.04 ppm DDT, but the osprey eating fish eating fish had 13.8 ppm — a 345x increase!",
    realWorldConnection: "This is why doctors warn pregnant women not to eat too much tuna — mercury bioaccumulates the same way DDT does. Top predator fish have the highest mercury levels.",
    tokConnection: "DDT seemed safe in the 1950s because they only tested it on individual organisms, not on food chains. What does this reveal about the limits of reductionist science — studying parts vs studying systems?",
    interdisciplinary: "Math: bioaccumulation follows exponential growth through trophic levels. History: Rachel Carson's book 'Silent Spring' (1962) exposed DDT's dangers and launched the environmental movement. English: this is a real-world example of 'unintended consequences' as a theme.",
    inquiryQuestion: "DDT saved millions of lives by killing malaria-carrying mosquitoes. It also poisoned eagles to near-extinction. How do we weigh human lives saved against species destroyed? Is there a right answer?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b17", front: "Only about ___% of energy is transferred from one trophic level to the next.", back: "10",
    answerType: "fill-blank",
    blankSentence: "Only about ___% of energy is transferred from one trophic level to the next.",
    explanation: "~90% of energy at each level is lost as heat (from respiration), movement, or undigested waste. That's why food chains rarely have more than 4-5 levels — there's not enough energy left to support more.",
    realWorldConnection: "This is why beef is expensive: a cow eats 10kg of grain to produce 1kg of beef. 90% of the grain's energy is 'lost' to the cow's body heat and movement. Eating plants directly is 10x more energy-efficient.",
    tokConnection: "Energy isn't 'lost' — it's converted to heat (1st law of thermodynamics). But we SAY it's 'lost' because it's no longer useful for the food chain. Is calling it 'lost' misleading? It depends on your frame of reference.",
    interdisciplinary: "Economics: this explains why vegetarian diets feed more people per acre. Math: if a field produces 10,000 kJ, level 2 gets 1,000, level 3 gets 100, level 4 gets 10 — a geometric sequence with ratio 0.1. Physics: entropy (2nd law of thermodynamics) guarantees energy disperses as heat.",
    inquiryQuestion: "If we could engineer an organism that was 50% efficient instead of 10%, it would revolutionize food production. Why hasn't evolution already done this? Is there a physical limit?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b18", front: "In the carbon cycle, what process removes CO₂ from the atmosphere?", back: "photosynthesis",
    answerType: "multiple-choice",
    choices: ["photosynthesis", "respiration", "combustion", "decomposition"],
    explanation: "Photosynthesis is the ONLY biological process that REMOVES CO₂ from the atmosphere (plants absorb it to make glucose). Respiration, combustion, and decomposition all RELEASE CO₂ back.",
    realWorldConnection: "Trees are 'carbon sinks' — they pull CO₂ out of the air and store it as wood. Deforestation releases that stored carbon AND removes the 'vacuum cleaner.' Double problem.",
    tokConnection: "We talk about 'balancing' the carbon cycle. But who decides what 'balanced' means? Pre-industrial levels? Dinosaur-era levels? The concept of 'balance' implies a value judgment about which state is 'correct.'",
    interdisciplinary: "Chemistry: photosynthesis (6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂) is a reduction reaction. Economics: carbon credits put a dollar value on this process. Politics: climate agreements depend on understanding this single equation.",
    inquiryQuestion: "If photosynthesis is the only thing removing CO₂, and we're cutting down forests while burning fossil fuels — can we do math to predict when the 'balance' tips? What data would you need?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b19", front: "Which type of bacteria converts atmospheric nitrogen into compounds plants can use?", back: "nitrogen-fixing bacteria",
    answerType: "multiple-choice",
    choices: ["nitrogen-fixing bacteria", "nitrifying bacteria", "denitrifying bacteria", "decomposers"],
    explanation: "Nitrogen-fixing bacteria (in soil or root nodules of legumes) convert N₂ gas → ammonia/nitrates that plants absorb. Nitrifying bacteria convert ammonia → nitrates. Denitrifying bacteria convert nitrates → N₂ gas (back to atmosphere).",
    realWorldConnection: "Farmers plant legumes (beans, peas, clover) to naturally add nitrogen to soil — these plants have nitrogen-fixing bacteria in their roots. It's free fertilizer!",
    tokConnection: "78% of the atmosphere is nitrogen, yet plants can't use it directly. They need bacteria to 'fix' it first. This invisible dependency means ALL life on Earth depends on microscopic organisms we rarely think about.",
    interdisciplinary: "Chemistry: the Haber process (1909) artificially fixes nitrogen for fertilizer — it's why Earth can feed 8 billion people. History: Fritz Haber won a Nobel Prize for this but also developed chemical weapons. Spanish: 'nitrógeno' — same word, Latin root.",
    inquiryQuestion: "The Haber process uses enormous energy to do what bacteria do for free. Why don't we just use more bacteria? What are the tradeoffs between biological and industrial solutions?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "b20", front: "What is eutrophication?", back: "excess nutrients cause algal blooms that deplete oxygen and kill aquatic life",
    answerType: "type",
    explanation: "Eutrophication: fertilizer runoff → excess nitrates in water → algal bloom → algae die → decomposers multiply → decomposers use up all the oxygen → fish suffocate and die. It's a chain reaction.",
    realWorldConnection: "The 'dead zone' in the Gulf of Mexico (size of New Jersey) is caused by eutrophication from Mississippi River farm runoff. No fish can survive there.",
    tokConnection: "Eutrophication is a system failure — each step seems harmless alone (fertilizer helps crops, algae are natural, decomposition is normal). The damage emerges from INTERACTIONS. Can we predict system-level failures from studying individual components?",
    interdisciplinary: "Math: eutrophication is a positive feedback loop (more algae → more death → more nutrients → MORE algae). Economics: the cost of eutrophication (dead fisheries, cleanup) often exceeds the value of the fertilizer that caused it. This is called a 'negative externality.'",
    inquiryQuestion: "Eutrophication is 'too much of a good thing' (nutrients). What other examples exist where excess of something beneficial becomes harmful? Is there a general principle here?",
    audioLang: "en-US", subject: "biology", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },

  // ===== SPANISH =====
  {
    id: "s01", front: "How do you greet someone in the morning in Spanish?", back: "buenos días",
    answerType: "type",
    explanation: "'Buenos' = good (plural), 'días' = days/morning. You use this greeting from sunrise until about noon. After noon, use 'buenas tardes'.",
    realWorldConnection: "When you walk into first period class, you'd say '¡Buenos días!' to your teacher — just like saying 'Good morning!'",
    tokConnection: "Greetings vary by culture — in Japan you bow, in France you kiss cheeks, in Spain you say 'buenos días.' Does language shape how we experience morning, or just label it?",
    interdisciplinary: "Biology: circadian rhythms determine when we feel 'morning' vs 'afternoon.' Different cultures divide the day differently — some have no word for 'afternoon' separate from 'evening.'",
    inquiryQuestion: "In Spanish, 'good morning' is plural (buenos días) but in English it's singular. What does this reveal about how each language conceptualizes time?",
    exampleSentence: "¡Buenos días, clase! ¿Cómo están?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s02", front: "¿Cómo te llamas?", back: "What is your name?",
    answerType: "type",
    explanation: "Literally means 'How do you call yourself?' — 'llamar' means 'to call'. The response is 'Me llamo ___' (I call myself ___).",
    realWorldConnection: "This is the first thing you'd say meeting a new exchange student or at a Spanish-speaking restaurant when introducing yourself.",
    tokConnection: "In Spanish you 'call yourself' a name (reflexive). In English, you 'have' a name (possessive). Does this difference in grammar reflect a different relationship between a person and their identity?",
    interdisciplinary: "Philosophy: naming theory asks whether names have inherent meaning. Psychology: studies show people rate 'easy to pronounce' names as more trustworthy. Math: variables are 'names' for unknowns.",
    inquiryQuestion: "Some cultures keep names secret and use different names in different contexts. If your name changes, does your identity change? What IS a name — a label or part of who you are?",
    exampleSentence: "¿Cómo te llamas? Me llamo Hailey.",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s03", front: "What is the Spanish word for the place where students go to learn every day?", back: "escuela",
    answerType: "fill-blank",
    blankSentence: "Voy a la ___ cada día. (I go to ___ every day.)",
    explanation: "'Escuela' is a feminine noun (la escuela). Related words: estudiante (student), estudiar (to study), escolar (school-related).",
    realWorldConnection: "In many Latin American countries, students wear uniforms to 'la escuela' and school days often run from 7am to 1pm.",
    tokConnection: "The word 'escuela' comes from Greek 'scholē' meaning 'leisure.' School originally meant FREE TIME for learning. How has the meaning of education changed across cultures and centuries?",
    interdisciplinary: "History: public education wasn't universal until the 1800s. Economics: education correlates with income (each year of schooling increases earnings ~10%). The concept of 'school' varies globally.",
    inquiryQuestion: "If 'escuela' originally meant leisure/free time, and now it feels like obligation — what happened? Is learning naturally enjoyable, and if so, what makes school feel different?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s04", front: "hablar", back: "to speak",
    answerType: "multiple-choice",
    choices: ["to speak", "to write", "to read", "to listen"],
    explanation: "'Hablar' is a regular -AR verb. Conjugation: yo hablo, tú hablas, él/ella habla, nosotros hablamos, ellos hablan.",
    realWorldConnection: "When someone asks '¿Hablas español?' at a restaurant, they're asking if you speak Spanish — you can answer 'Un poco' (a little)!",
    tokConnection: "Speaking (hablar) and knowing (saber) are different. You can know grammar rules but not be able to speak fluently. What kind of knowledge is language — intellectual or embodied?",
    interdisciplinary: "Biology: the human vocal tract evolved specifically for complex speech — no other animal has our larynx position. Psychology: bilingual speakers actually think differently in each language.",
    inquiryQuestion: "Can you 'know' a language without speaking it? A deaf person can know Spanish through reading/writing. Does 'hablar' (to speak) capture all of what language IS?",
    exampleSentence: "Yo hablo español en clase.",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s05", front: "'Escribir' means 'to read' in Spanish.", back: "false",
    answerType: "true-false",
    trueFalseStatement: "'Escribir' means 'to read' in Spanish.",
    trueFalseAnswer: false,
    explanation: "'Escribir' means 'to WRITE', not to read. 'Leer' means to read. Remember: escribir → script/scribe (writing).",
    realWorldConnection: "When your teacher says 'Escriban sus nombres' she's saying 'Write your names' — like filling out the top of a test paper.",
    tokConnection: "English cognates (escribir → scribe/script) help us guess meanings. But cognates can also be 'false friends' (embarazada ≠ embarrassed, it means pregnant). How reliable is pattern-matching as a way of knowing?",
    interdisciplinary: "History: scribes were among the most powerful people in ancient Egypt — writing = power. Technology: algorithms now 'write' (generate text). Does AI 'escribir' in the same sense humans do?",
    inquiryQuestion: "If an AI can 'escribir' a perfect Spanish essay, does it 'know' Spanish? What's the difference between generating correct output and understanding meaning?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s06", front: "What is the Spanish word for the color of blood or fire?", back: "rojo",
    answerType: "type",
    explanation: "'Rojo' is an adjective that changes with gender: rojo (masculine), roja (feminine). El carro rojo (the red car), la casa roja (the red house).",
    realWorldConnection: "The red in the Mexican flag represents the blood of heroes — 'rojo' is one of the most common colors in Latin American flags.",
    tokConnection: "Some languages have no word for 'blue' — they group it with green. Russian has two separate words for light blue and dark blue. Does your language determine what colors you can SEE?",
    interdisciplinary: "Physics: 'red' is just light at ~700nm wavelength. Biology: we see red because of cone cells. Art: red evokes danger, passion, and power across most cultures. Same phenomenon, different ways of knowing.",
    inquiryQuestion: "If a colorblind person learns the word 'rojo' and uses it correctly in context, do they 'know' what red is? What kind of knowledge are they missing — and does it matter?",
    exampleSentence: "El carro es rojo.",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },

  // Spanish - Days of the Week
  {
    id: "s07", front: "What is Monday in Spanish?", back: "lunes",
    answerType: "type",
    explanation: "'Lunes' comes from 'luna' (moon) — Moon-day, just like English Monday! Days of the week are NOT capitalized in Spanish.",
    realWorldConnection: "When checking your school schedule in a Spanish-speaking country, Monday is always 'lunes' — and the week starts on Monday, not Sunday.",
    tokConnection: "Many Spanish days come from planets/gods (lunes=moon, martes=Mars, miércoles=Mercury). English days come from Norse gods (Tuesday=Tyr, Wednesday=Woden). What does our naming of time reveal about cultural values?",
    interdisciplinary: "Astronomy: lunes (moon), martes (Mars), miércoles (Mercury), jueves (Jupiter), viernes (Venus). The solar system is literally embedded in how Spanish speakers name their week.",
    inquiryQuestion: "If every day is named after a celestial body in Spanish, what would you name a new 8th day of the week? What would that say about what your culture values?",
    exampleSentence: "El lunes tengo clase de español.",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s08", front: "What are the days of the week in Spanish? (Mon-Sun)", back: "lunes, martes, miércoles, jueves, viernes, sábado, domingo",
    answerType: "type",
    explanation: "Mon=lunes, Tue=martes, Wed=miércoles, Thu=jueves, Fri=viernes, Sat=sábado, Sun=domingo. All lowercase in Spanish! 'El fin de semana' = the weekend.",
    realWorldConnection: "Spanish calendars start on Monday (lunes), not Sunday like American ones. This affects how you read school schedules and plan your week abroad.",
    tokConnection: "The 7-day week isn't based on astronomy (months follow the moon, years follow the sun). It's a purely human invention from ancient Babylon. How much of how we organize time is natural vs constructed?",
    interdisciplinary: "History: sábado comes from Sabbath (Hebrew), domingo from 'Dominus' (Lord's day in Latin). Religion shaped how entire civilizations named and structured time.",
    inquiryQuestion: "Some cultures have used 5-day, 8-day, or 10-day weeks. If we redesigned the week from scratch, how many days would be ideal for learning and rest?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s09", front: "What is 'January' in Spanish?", back: "enero",
    answerType: "type",
    explanation: "Enero comes from 'Janus,' the Roman god of beginnings (two faces looking forward and back). Months are NOT capitalized in Spanish.",
    realWorldConnection: "Hailey's birthday month or the start of a new semester — '¿En qué mes es tu cumpleaños?' (What month is your birthday?)",
    tokConnection: "Our month names are Roman: enero (Januarius), febrero (Februarius), marzo (Martius). We use a 2,000-year-old naming system daily without thinking about it. How does invisible history shape present knowledge?",
    interdisciplinary: "History: July (julio) and August (agosto) are named after Julius Caesar and Augustus. September-December are misnamed — 'sept' means 7 but September is month 9. The Romans added months and broke the pattern.",
    inquiryQuestion: "September means 'seventh month' but it's the 9th month. Should we rename months to fix this? What would we lose by 'correcting' a historical error?",
    exampleSentence: "Mi cumpleaños es en enero.",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s10", front: "How do you say 11 in Spanish?", back: "once",
    answerType: "multiple-choice",
    choices: ["once", "diez", "doce", "uno"],
    explanation: "11=once, 12=doce, 13=trece, 14=catorce, 15=quince. These are unique words (not compounds). Starting at 16, they become 'dieci-' + ones digit: dieciséis, diecisiete, etc.",
    realWorldConnection: "If you're at a restaurant and your table number is 11, the host says 'mesa once.' Knowing 11-15 as unique words is essential for addresses, phone numbers, and prices.",
    tokConnection: "English has unique words for 11-12 (eleven, twelve) then switches to patterns (thir-teen). Spanish does the same through 15. Why do languages have irregular numbers? Does irregularity make numbers harder to learn?",
    interdisciplinary: "Math: base-10 systems create patterns after certain thresholds. Linguistics: languages that have more regular number systems (like Chinese) produce children who learn counting faster. Language structure affects mathematical thinking.",
    inquiryQuestion: "Chinese numbers are perfectly regular (11 = 'ten-one', 12 = 'ten-two'). Studies show Chinese children learn math faster. Should we redesign Spanish/English numbers to be more logical?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s11", front: "What is the rule for making cognates from English '-ty' words?", back: "change -ty to -dad",
    answerType: "fill-blank",
    blankSentence: "To convert English words ending in '-ty' to Spanish, change the ending to '-___'.",
    explanation: "University → Universidad, Velocity → Velocidad, Eternity → Eternidad, Humanity → Humanidad. This one rule gives you hundreds of Spanish words instantly!",
    realWorldConnection: "When you see a sign for 'Universidad' in a Spanish-speaking country, you instantly know it means 'University' — cognates are your shortcut to reading Spanish everywhere.",
    tokConnection: "Cognates work because Spanish and English share Latin roots. But this 'shortcut' only works for academic/formal words. Everyday words (dog, house, run) have NO cognates. What does this reveal about which social class historically shared vocabulary between languages?",
    interdisciplinary: "History: Latin spread through Roman colonization, then academic/legal/medical vocabulary spread through education. Cognates are literally the fingerprint of empire on modern language.",
    inquiryQuestion: "If cognates come from shared Latin roots through colonization — is using them celebrating linguistic heritage or erasing indigenous languages that existed before Latin arrived?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s12", front: "The letter 'H' in Spanish is always ___.", back: "silent",
    answerType: "fill-blank",
    blankSentence: "The letter 'H' in Spanish is always ___.",
    explanation: "H is NEVER pronounced in Spanish. 'Hola' = 'ola', 'hay' = 'ai', 'hacer' = 'acer'. The only exception is 'ch' which makes a 'ch' sound (like 'chocolate').",
    realWorldConnection: "When you say 'Hola!' you never pronounce the H — it's just 'OH-lah.' If you hear someone say 'hh-ola' with an H sound, they're speaking English, not Spanish.",
    tokConnection: "If H is always silent, why keep it in the spelling? It's historical — these words had an H sound in Latin. Spanish preserves etymological history in its spelling. Is spelling a record of the past or a tool for the present?",
    interdisciplinary: "English has silent letters too (knife, psychology, Wednesday). Biology: vestigial organs (appendix, tailbone) are the body's 'silent letters' — remnants of a past that no longer serve a function.",
    inquiryQuestion: "If we removed all silent letters from every language, writing would be simpler but we'd lose etymological clues. Is efficiency or history more important in a writing system?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s13", front: "What does 'hay' mean in Spanish?", back: "there is / there are",
    answerType: "type",
    explanation: "'Hay' (pronounced like English 'eye') means both 'there is' AND 'there are.' It's one of the most common words in Spanish. 'Hay un libro' = There is a book. 'Hay tres libros' = There are three books.",
    realWorldConnection: "At a store: '¿Hay WiFi aquí?' (Is there WiFi here?) At school: 'Hay un examen mañana' (There's a test tomorrow). You'll use 'hay' every single day.",
    tokConnection: "Spanish uses ONE word (hay) where English needs two phrases (there is / there are). Does having fewer words make a language simpler, or does each word carry more ambiguity?",
    interdisciplinary: "Philosophy: 'there is' (existence statements) are fundamental to logic. Math: 'there exists' (∃) is a core symbol in proofs. The concept of 'something exists' bridges every discipline.",
    inquiryQuestion: "'Hay' doesn't change for singular or plural. English forces you to specify (is/are). Which approach gives the listener MORE information? Which gives the speaker more freedom?",
    exampleSentence: "Hay veinte estudiantes en la clase.",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s14", front: "What Spanish word means 'bread' and sounds like a cooking utensil in English?", back: "pan",
    answerType: "multiple-choice",
    choices: ["bread", "pan (cooking)", "paper", "father"],
    explanation: "'Pan' = bread. Mnemonic from the book: imagine cooking bread IN a pan! 'Panadería' = bakery. This is a false cognate — it has nothing to do with a cooking pan.",
    realWorldConnection: "In any Spanish-speaking country, a 'panadería' (bakery) is on almost every block. 'Pan dulce' (sweet bread) is a breakfast staple in Mexico.",
    tokConnection: "'Pan' looks like the English word 'pan' but means something completely different. These false cognates reveal that similarity in form does NOT guarantee similarity in meaning. How do we avoid being fooled by surface patterns?",
    interdisciplinary: "Economics: bread ('pan') has been a symbol of basic needs across all cultures ('bread and butter,' 'breadwinner'). History: bread riots have triggered revolutions (France 1789, Egypt 2011). One word, massive political power.",
    inquiryQuestion: "The word 'companion' comes from Latin 'com-panis' (with bread = someone you share bread with). What does food-sharing reveal about how humans define friendship across cultures?",
    exampleSentence: "Compro pan en la panadería.",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s15", front: "How do you say 20 in Spanish?", back: "veinte",
    answerType: "type",
    explanation: "20=veinte. Numbers 21-29 are one word: veintiuno, veintidós, veintitrés... After 30, they use 'y': treinta y uno (31), treinta y dos (32), etc.",
    realWorldConnection: "Your age, your address, prices at the store — numbers 20-30 come up constantly. 'Tengo quince años' (I'm 15), 'Son veinte dólares' (That's 20 dollars).",
    tokConnection: "Spanish numbers 21-29 are compressed into one word (veintiuno) but 31+ use two words (treinta y uno). Why does the pattern change at 30? Language evolves based on frequency of use — common numbers get shortened.",
    interdisciplinary: "Math: the Mayan number system was base-20 (veinte). They counted with fingers AND toes. Our base-10 system comes from counting only fingers. The structure of math depends on the body that invented it.",
    inquiryQuestion: "If humans had 8 fingers, would we use base-8? Would math be different, or just the symbols? Is mathematics discovered or invented by bodies with specific anatomy?",
    exampleSentence: "Hay veinte estudiantes en mi clase.",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s16", front: "The Spanish 'J' is pronounced like English ___.", back: "H",
    answerType: "fill-blank",
    blankSentence: "The Spanish 'J' (jota) is pronounced like the English letter ___.",
    explanation: "Spanish J sounds like English H: 'Juan' = 'Hwan', 'jueves' = 'HWE-ves', 'naranja' = 'na-RAN-ha'. Meanwhile, Spanish H is completely silent!",
    realWorldConnection: "When you see 'José' or 'jalapeño', pronounce the J as H: 'ho-SEH', 'ha-la-PEH-nyo.' This is why English speakers mispronounce these words.",
    tokConnection: "The same letter (J) makes different sounds in different languages. How do we 'know' what a letter sounds like? Is it the shape on the page, or the community that agrees on its pronunciation?",
    interdisciplinary: "Physics: sound is just vibration at different frequencies. The difference between 'j' and 'h' sounds is WHERE in your throat you constrict airflow. Biology meets linguistics at the vocal tract.",
    inquiryQuestion: "If you grew up hearing Spanish J as 'H', that IS the correct sound for you. A sound isn't inherently 'right' or 'wrong.' What makes pronunciation 'correct' — history, majority, or authority?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },

  // Spanish - Number Patterns
  {
    id: "s17", front: "Spanish numbers 1-15 must be ___.", back: "memorized as unique words",
    answerType: "multiple-choice",
    choices: ["memorized as unique words", "built from a pattern", "the same as English", "spelled phonetically"],
    explanation: "1-15 are unique: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez, once, doce, trece, catorce, quince. No shortcut — these are the building blocks for everything above 15.",
    realWorldConnection: "These 15 words are like the alphabet of Spanish math. Once you own them, every number above 15 is just combining these pieces in predictable ways.",
    tokConnection: "Why are 1-15 irregular in BOTH English and Spanish? Linguists believe frequently-used words resist regularization because speakers memorize them before learning the pattern. Is irregular = older?",
    interdisciplinary: "Math: prime numbers are also 'irregular' — they don't follow a pattern and must be individually identified. Biology: the genetic code has 'irregular' start/stop codons that must be memorized, not derived.",
    inquiryQuestion: "Children learn 1-15 before they learn the pattern. Adults learning Spanish try to find the pattern first. Which approach works better — memorize then pattern, or pattern then memorize?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s18", front: "For numbers 16-19, the pattern is: dieci + ___", back: "ones digit word",
    answerType: "fill-blank",
    blankSentence: "For numbers 16-19, the pattern is: dieci + ___ (written as one word).",
    explanation: "16=dieciséis (dieci+seis), 17=diecisiete (dieci+siete), 18=dieciocho (dieci+ocho), 19=diecinueve (dieci+nueve). Think of it as 'diez y seis' squished into one word: dieciséis.",
    realWorldConnection: "When you're 16, you'd say 'Tengo dieciséis años.' It's literally 'ten-and-six' compressed. Same logic as English 'sixteen' (six-teen = six + ten).",
    tokConnection: "Spanish compressed 'diez y seis' into 'dieciséis' over centuries of spoken use. Language evolves by compression — frequently combined words merge. Is texting slang ('gonna', 'wanna') the same process happening now?",
    interdisciplinary: "Computer Science: data compression works the same way — frequently repeated patterns get shorter codes. Language and algorithms both optimize for efficiency through the same principle.",
    inquiryQuestion: "English did the same thing: 'six and ten' became 'sixteen.' If language always compresses frequent combinations, what modern phrases might become single words in 200 years?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s19", front: "For numbers 21-29, the pattern is: veinti + ___", back: "ones digit word",
    answerType: "fill-blank",
    blankSentence: "For numbers 21-29, the pattern is: veinti + ___ (written as one word).",
    explanation: "21=veintiuno, 22=veintidós, 23=veintitrés, 24=veinticuatro, 25=veinticinco, 26=veintiséis, 27=veintisiete, 28=veintiocho, 29=veintinueve. Same compression as 16-19 but with 'veinte' as the base.",
    realWorldConnection: "If something costs $25, it's 'veinticinco dólares.' Ages 21-29 are all one-word numbers: 'Tengo veintitrés años' (I'm 23).",
    tokConnection: "16-29 are all compressed into single words, but 31+ are not. The boundary at 30 is arbitrary — it exists because 21-29 were used SO frequently that speakers compressed them. Usage shapes grammar, not logic.",
    interdisciplinary: "Math: the pattern shift at 30 is like a piecewise function — one rule for [16,29], a different rule for [30,99]. Spanish numbers ARE a piecewise function with three domains!",
    inquiryQuestion: "Why did compression stop at 29? Could it be because most daily quantities (days in a month, students in a class) are under 30? Does the frequency of real-world use shape how language evolves?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s20", front: "For numbers 30-99, the pattern is: [tens] + ___ + [ones]", back: "y",
    answerType: "fill-blank",
    blankSentence: "For numbers 30-99, the pattern is: [tens word] + ___ + [ones word].",
    explanation: "31 = treinta Y uno, 42 = cuarenta Y dos, 57 = cincuenta Y siete, 99 = noventa Y nueve. The tens words: 30=treinta, 40=cuarenta, 50=cincuenta, 60=sesenta, 70=setenta, 80=ochenta, 90=noventa.",
    realWorldConnection: "Once you know the 7 tens words (treinta through noventa) and 'y' (and), you can say ALL numbers from 30-99. That's 70 numbers from just 7 new words + a pattern!",
    tokConnection: "'Y' means 'and' — so 'treinta y uno' literally means 'thirty AND one.' English doesn't use 'and' (we say 'thirty-one' not 'thirty and one'). Why do some languages make the addition explicit while others hide it?",
    interdisciplinary: "Math: this is literally addition spoken aloud. 'Cuarenta y siete' = 40 + 7 = 47. Spanish makes the mathematical operation VISIBLE in the language. English hides it ('forty-seven' doesn't sound like addition).",
    inquiryQuestion: "If you're learning both math and Spanish, does seeing numbers as explicit addition (cuarenta Y siete = 40 AND 7) help you understand place value better? Can language be a math teaching tool?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s21", front: "What are the 7 tens words in Spanish? (30-90)", back: "treinta, cuarenta, cincuenta, sesenta, setenta, ochenta, noventa",
    answerType: "type",
    explanation: "30=treinta (tres→), 40=cuarenta (cuatro→), 50=cincuenta (cinco→), 60=sesenta (seis→), 70=setenta (siete→), 80=ochenta (ocho→), 90=noventa (nueve→). Notice: each tens word starts with a hint of its ones digit!",
    realWorldConnection: "Look at the pattern: cuatro→cuarenta, cinco→cincuenta, seis→sesenta. The ones digit 'grows up' into its tens version. You already know the seeds — now see how they grow.",
    tokConnection: "These words aren't random — they evolved from their root numbers. 'Cuarenta' clearly comes from 'cuatro.' Pattern recognition across etymology is a way of knowing that connects present to past.",
    interdisciplinary: "Biology: evolutionary homology works the same way — a whale's flipper, a bat's wing, and your arm all come from the same ancestral bone structure, just 'grown' differently. Etymology IS linguistic evolution.",
    inquiryQuestion: "If treinta comes from tres, cuarenta from cuatro... why doesn't 20 follow the pattern? (It should be 'dosenta' not 'veinte'). What happened historically to make 20 and 30 irregular?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s22", front: "How would you say 76 in Spanish?", back: "setenta y seis",
    answerType: "type",
    explanation: "76 = 70 + 6 = setenta + y + seis = 'setenta y seis.' Formula: [tens word] y [ones word]. Works for ANY number from 31-99!",
    realWorldConnection: "If your grandparent is 76 years old: 'Mi abuela tiene setenta y seis años.' You can now say any age, price, or address number.",
    tokConnection: "You just used a RULE to generate a number you've never seen before. That's the power of pattern-based knowledge vs memorization. Which is more durable — memorizing 70 numbers, or learning 1 rule?",
    interdisciplinary: "Math: this is function composition in disguise. f(tens, ones) = [tens word] + 'y' + [ones word]. You're evaluating a function! Computer Science: this is exactly how number-to-text algorithms work.",
    inquiryQuestion: "You've never been taught 'setenta y seis' specifically — you generated it from a rule. Is knowledge you derive yourself more reliable than knowledge you're told? What are the risks of each?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "s23", front: "Spanish numbers are like a piecewise function with ___ zones.", back: "3",
    answerType: "multiple-choice",
    choices: ["3", "2", "4", "5"],
    explanation: "Zone 1 (1-15): memorize unique words. Zone 2 (16-29): prefix + ones digit, one word (dieciséis, veintiuno). Zone 3 (30-99): tens + y + ones, three words (treinta y uno). Three zones, three rules!",
    realWorldConnection: "Think of it like learning to drive: Zone 1 = learn the controls (memorize). Zone 2 = parking lot practice (simple patterns). Zone 3 = open road (full pattern freedom). You level up through the zones.",
    tokConnection: "We're describing LANGUAGE with a MATH concept (piecewise functions). Does cross-disciplinary thinking help or confuse? Can math describe everything, or do some things resist mathematical framing?",
    interdisciplinary: "Math: f(n) = {unique word if n≤15, 'dieci/veinti'+ones if 16≤n≤29, tens+'y'+ones if 30≤n≤99}. This IS the piecewise function. The Spanish number system and math are describing the same pattern in different notation.",
    inquiryQuestion: "If you taught this as a math problem instead of a language lesson — 'here's a piecewise function, evaluate it for n=47' — would students learn Spanish numbers faster or slower?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },

  // ===== SPANISH - Quizlet Conversational Vocabulary (Ms. Fawson's Deck) =====
  {
    id: "sq01", front: "You're meeting your friend's grandmother for the first time. Which form of 'How are you?' shows proper respect?", back: "¿Cómo está usted?",
    answerType: "multiple-choice",
    choices: ["¿Cómo está usted?", "¿Cómo estás?", "¿Qué tal?", "¿Qué pasa?"],
    explanation: "'¿Cómo está usted?' is the formal form — used with elders, teachers, strangers. '¿Cómo estás?' uses 'tú' (familiar) and is for friends and peers.",
    realWorldConnection: "In a job interview in Madrid or Mexico City, using 'tú' with the interviewer could cost you the position. Formality signals respect and social awareness.",
    tokConnection: "English lost its formal 'you' (thou was actually the familiar form). Spanish preserves this distinction. Does having fewer pronouns make English more egalitarian, or just hide social hierarchies?",
    interdisciplinary: "Sociology: power dynamics are encoded in language. Japanese has multiple formality levels. French has tu/vous. The grammar of a language reveals its society's values about hierarchy.",
    inquiryQuestion: "If a culture removes formal pronouns (like English did), do social hierarchies weaken, or do people just find other ways to signal status?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq02", front: "It's 9 PM and you arrive at a dinner party in Barcelona. What time-appropriate greeting do you use?", back: "buenas noches",
    answerType: "type",
    explanation: "'Buenas noches' = good evening/good night. Use after dark (~8 PM). Unlike English, the same phrase works as both a greeting AND a farewell at night.",
    realWorldConnection: "Spanish dinner culture runs late — eating at 9-10 PM is normal. You'd greet hosts with '¡Buenas noches!' at a time when Americans would already be saying 'goodnight' to go to bed.",
    tokConnection: "In English, 'good night' is ONLY a farewell. In Spanish, 'buenas noches' is both hello and goodbye. Does meaning live in words themselves, or in context of use?",
    interdisciplinary: "Biology: circadian rhythms differ across cultures — Spanish siestas shift the entire daily schedule later. Geography: Spain's time zone pushes sunset later, affecting greeting patterns.",
    inquiryQuestion: "If Spanish culture eats dinner at 10 PM, is 'buenas noches' a greeting for a longer portion of social life than 'good evening' is in English?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq03", front: "Someone asks '¿Cómo estás?' and you're feeling neither good nor bad. What's the Spanish 'so-so'?", back: "más o menos",
    answerType: "fill-blank",
    blankSentence: "—¿Cómo estás? —___ (so-so / more or less).",
    explanation: "'Más o menos' = more or less. It sits between 'bien' (fine) and 'mal' (bad). Other options: 'regular' (okay) or 'muy bien' (very well).",
    realWorldConnection: "In Spanish-speaking cultures, 'más o menos' is a perfectly acceptable honest answer — there's less pressure to always say 'bien' like in American 'I'm fine' culture.",
    tokConnection: "English speakers almost always say 'fine' regardless of how they feel. Spanish offers a socially accepted middle answer. Does having a word for 'so-so' make people more honest about their feelings?",
    interdisciplinary: "Psychology: cultures with more emotion vocabulary report more nuanced emotional experiences. Math: 'más o menos' is literally ± applied to daily well-being.",
    inquiryQuestion: "If you only had two options — 'bien' or 'mal' — would you round up or down? What does your default reveal about cultural expectations?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq04", front: "'Te presento a...' is the formal way to introduce someone in Spanish.", back: "false",
    answerType: "true-false",
    trueFalseStatement: "'Te presento a...' is the formal way to introduce someone in Spanish.",
    trueFalseAnswer: false,
    explanation: "'TE presento a' is FAMILIAR (tú). The formal version is 'LE presento a.' The pronoun changes: te (familiar) vs le (formal), paralleling the tú/usted distinction.",
    realWorldConnection: "At a business conference: 'Le presento a mi colega' (formal). At a party with friends: 'Te presento a mi amigo' (familiar).",
    tokConnection: "The formality distinction appears in EVERY interaction in Spanish. English has no grammatical formality, only tone. Which system gives the speaker more precision?",
    interdisciplinary: "History: 'usted' comes from 'vuestra merced' (your mercy/grace), addressing nobility. Grammar preserves social history long after the society changes.",
    inquiryQuestion: "If 'usted' originally meant 'your grace' (royalty), and now it's used for any stranger — has formality been democratized or just repackaged?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq05", front: "You step outside in December and can see your breath. Which weather expression describes this?", back: "Hace frío",
    answerType: "multiple-choice",
    choices: ["Hace frío", "Hace calor", "Hace viento", "Hace sol"],
    explanation: "'Hace frío' = It's cold. Spanish says weather 'makes cold' rather than 'is cold.' Other 'hace' expressions: hace calor (hot), hace sol (sunny), hace viento (windy).",
    realWorldConnection: "In Latin America, 'hace frío' might mean 60°F — what a Minnesotan would call mild. Temperature perception is culturally relative.",
    tokConnection: "English says 'IT is cold' — what is 'it'? Spanish says 'hace frío' (it makes cold) — who is making it? Both use impersonal constructions. What does this reveal about how humans conceptualize nature?",
    interdisciplinary: "Physics: temperature is molecular motion, not a 'thing.' Yet every language treats cold/hot as entities. Our language reflects biological bias — we feel temperature relative to body temp.",
    inquiryQuestion: "A fish doesn't experience 'hace frío.' Is weather a human concept that only exists because we compare 'now' to a preferred state?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq06", front: "How do you ask 'What's the weather like?' in Spanish?", back: "¿Qué tiempo hace?",
    answerType: "type",
    explanation: "Literally: 'What weather does it make?' The word 'tiempo' means both 'weather' AND 'time' in Spanish. Responses use 'hace + condition': hace sol, hace frío, hace calor.",
    realWorldConnection: "Planning a beach day in Cancún? Ask '¿Qué tiempo hace?' and listen for 'hace sol' (sunny) or 'llueve' (raining).",
    tokConnection: "'Tiempo' means both 'time' and 'weather.' Does combining these concepts suggest Spanish speakers perceive them as more connected?",
    interdisciplinary: "Philosophy: the Greeks had 'chronos' (clock time) and 'kairos' (right moment). Spanish has one word for two English concepts. Word count shapes the distinctions we easily make.",
    inquiryQuestion: "If 'tiempo' means both 'weather' and 'time,' could misunderstandings arise? Or does context always clarify?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq07", front: "You accidentally bump into someone at a market. What single word expresses 'excuse me' as an apology?", back: "perdón",
    answerType: "fill-blank",
    blankSentence: "You bump someone's shoulder: '¡___!' (Excuse me / Pardon!)",
    explanation: "'Perdón' = when you've done something wrong (bumping, interrupting). For getting attention or asking someone to move, use 'disculpe' or 'con permiso' — different social functions.",
    realWorldConnection: "In crowded markets or metro stations, '¡perdón!' and '¡con permiso!' are constantly heard. Knowing which to use shows social fluency beyond vocabulary.",
    tokConnection: "English uses 'excuse me' for both apologies AND getting attention. Spanish distinguishes them. More words = more precision, but also more room for error.",
    interdisciplinary: "Psychology: saying 'sorry' activates empathy circuits in both speaker and listener. Cultures with more politeness vocabulary tend to have stricter social harmony expectations.",
    inquiryQuestion: "Japanese has dozens of apology words. Spanish has several. English uses one phrase. Does having more apology options make a culture more polite or more anxious?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq08", front: "A female speaker says 'Encantado' when meeting someone new.", back: "false",
    answerType: "true-false",
    trueFalseStatement: "A female speaker says 'Encantado' when meeting someone new.",
    trueFalseAnswer: false,
    explanation: "Female = 'Encantada' (-a ending). Male = 'Encantado' (-o ending). The adjective agrees with the SPEAKER's gender, not the person being met.",
    realWorldConnection: "When Hailey introduces herself, she'd say 'Encantada' — the -a marks HER gender. If meeting a man or woman doesn't matter; it's always about the speaker.",
    tokConnection: "Spanish grammar requires you to 'declare' your gender in every self-descriptive adjective. English reveals nothing. Does embedding identity in grammar reinforce or simply reflect gender categories?",
    interdisciplinary: "Linguistics: non-binary Spanish speakers have proposed 'encantade' (with -e ending). Language evolves when society's categories change. Sociology: grammar can be a site of political resistance.",
    inquiryQuestion: "If grammatical gender requires declaring your gender constantly, what challenges does this create for non-binary speakers? Can grammar evolve faster than society?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq09", front: "School ends and you'll see your classmate tomorrow. Which farewell specifically promises you'll meet the next day?", back: "hasta mañana",
    answerType: "multiple-choice",
    choices: ["hasta mañana", "hasta luego", "adiós", "buenas noches"],
    explanation: "'Hasta mañana' = until tomorrow (specific). 'Hasta luego' = until later (vague). 'Adiós' = goodbye (general/final). Each farewell carries a different promise about reconnection.",
    realWorldConnection: "Teachers often end class with '¡Hasta mañana, clase!' — it sets expectation of return. 'Adiós' would feel oddly final, like you might not come back.",
    tokConnection: "Spanish farewells encode TIME expectations: hasta mañana (tomorrow), hasta luego (later), hasta pronto (soon). English 'goodbye' (from 'God be with you') encodes a BLESSING. What does each culture prioritize in parting?",
    interdisciplinary: "Psychology: specific plans ('see you tomorrow') create stronger social bonds than vague ones ('see you around'). Grammar shapes relationships.",
    inquiryQuestion: "If 'hasta mañana' creates an expectation, is it a social obligation? Can a farewell be a promise?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq10", front: "You're asking a professor where they are from. How do you phrase this using formal register?", back: "¿De dónde es usted?",
    answerType: "type",
    explanation: "Formal: '¿De dónde es usted?' (third-person verb 'es'). Familiar: '¿De dónde eres?' (second-person verb 'eres'). The verb conjugation ITSELF signals formality.",
    realWorldConnection: "Meeting a host family parent abroad or interviewing a community elder — situations where '¿De dónde es usted?' is appropriate.",
    tokConnection: "In Spanish, formality changes the VERB (eres vs es), not just the pronoun. Grammar itself encodes respect. In English, we rely on tone and word choice. Which is clearer?",
    interdisciplinary: "Anthropology: asking 'where are you from?' carries different weight across cultures. In some it's friendly; in others it can feel exclusionary. Same question, different power dynamics.",
    inquiryQuestion: "If you accidentally use 'tú' with a professor, is that a grammar error or a social error? Where does language end and culture begin?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq11", front: "The sky is bright and cloudless. Complete the weather expression: 'Hace ___.'", back: "sol",
    answerType: "fill-blank",
    blankSentence: "The sky is clear and bright: 'Hace ___.'",
    explanation: "'Hace sol' = It's sunny. Weather with 'hace': sol (sunny), calor (hot), frío (cold), viento (windy). Exceptions: 'Llueve' (rains) and 'Nieva' (snows) use different verbs — no 'hace.'",
    realWorldConnection: "In equatorial Spanish-speaking countries, 'hace sol' is the default — they specify when it's NOT sunny. Vocabulary reflects what varies in your environment.",
    tokConnection: "Some weather uses 'hace' but rain/snow use their own verbs. The grammar isn't consistent — it's idiomatic. Does inconsistency reflect how humans actually perceive different weather phenomena?",
    interdisciplinary: "Geography: equatorial countries emphasize rain distinctions (llovizna = drizzle, aguacero = downpour) because that's what varies. Vocabulary maps to environmental importance.",
    inquiryQuestion: "Do Spanish-speaking tropical cultures have many words for rain types, like Inuit languages have for snow? Does environment determine which concepts language develops?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq12", front: "Someone says 'Mucho gusto' after being introduced. Which response means 'likewise'?", back: "igualmente",
    answerType: "multiple-choice",
    choices: ["igualmente", "de nada", "por favor", "perdón"],
    explanation: "'Igualmente' = likewise/same here. Other valid responses: 'mucho gusto' back, 'el gusto es mío' (the pleasure is mine), or 'encantado/a.' 'De nada' = you're welcome (wrong context).",
    realWorldConnection: "Introduction chain at a party: 'Te presento a María.' '¡Mucho gusto!' 'Igualmente.' — Three lines that complete a social ritual.",
    tokConnection: "'Igualmente' comes from 'igual' (equal). By saying 'equally,' you establish social parity. Does reciprocal politeness create real bonds, or just the appearance of them?",
    interdisciplinary: "Math: 'igualmente' is literally an equality statement. Economics: gift exchange theory shows that minimizing favors ('de nada') paradoxically strengthens social debts.",
    inquiryQuestion: "If someone says 'mucho gusto' and you forget to respond, is the social ritual incomplete? Do people feel the gap?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq13", front: "After someone asks how you are, you want to ask them back. Speaking to a close friend, what do you say?", back: "¿Y tú?",
    answerType: "multiple-choice",
    choices: ["¿Y tú?", "¿Y usted?", "¿Cómo está usted?", "¿Quién es?"],
    explanation: "'¿Y tú?' = And you? (familiar). '¿Y usted?' = And you? (formal). Match the formality of what was asked of you.",
    realWorldConnection: "Typical hallway exchange: '¡Hola! ¿Cómo estás?' 'Bien, ¿y tú?' 'Muy bien, gracias.' — This three-line pattern is everywhere in Spanish-speaking life.",
    tokConnection: "You must CHOOSE tú or usted — no neutral option. Every interaction forces a formality decision. Does this make Spanish speakers more socially aware, or is it just automatic?",
    interdisciplinary: "Psychology: code-switching (shifting register) is cognitive work. Bilingual speakers switching formal/familiar show increased executive function brain activity. Grammar exercises the social brain.",
    inquiryQuestion: "What if you're unsure whether to use tú or usted? Do Spanish speakers ever freeze with indecision in ambiguous situations?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq14", front: "Someone does you a favor. What's the two-part gratitude exchange in Spanish?", back: "gracias / de nada",
    answerType: "type",
    explanation: "'Gracias' (thank you) from 'gracia' (grace). 'De nada' (you're welcome) literally means 'of nothing' — minimizing the favor. Together they complete the gratitude ritual.",
    realWorldConnection: "Buying street food: vendor hands you a taco, you say 'gracias,' they say 'de nada' or '¡a usted!' (to YOU — thank you for buying). Gratitude flows both ways.",
    tokConnection: "'De nada' means 'it's nothing' — the giver downplays effort. English 'you're welcome' acknowledges generosity. Spanish minimizes; English highlights. Which builds better social bonds?",
    interdisciplinary: "Economics: saying 'it's nothing' actually INCREASES social obligation because it suggests the giver didn't notice the cost. Minimizing favors paradoxically strengthens debts.",
    inquiryQuestion: "'No problem' is replacing 'you're welcome' in English — paralleling 'de nada.' Is English shifting toward Spanish-style humility?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq15", front: "The teacher asks your name on the first day at a new school in Colombia. How do you respond?", back: "Me llamo...",
    answerType: "fill-blank",
    blankSentence: "—¿Cómo te llamas? —___ [your name]. (My name is...)",
    explanation: "'Me llamo' literally means 'I call myself' — reflexive. Alternative: 'Soy ___' (I am ___) — simpler but less traditional for introductions.",
    realWorldConnection: "First day of school, meeting a host family, introducing yourself at a Spanish club — 'Me llamo ___' is your identity statement.",
    tokConnection: "Spanish says 'I call myself' (active, self-created). English says 'my name IS' (passive, externally assigned). Does Spanish grammar suggest names are something you DO rather than HAVE?",
    interdisciplinary: "Philosophy: identity theory asks whether your name defines you or you define it. Literature: characters who rename themselves (Jay Gatsby, Malcolm X) are performing the Spanish grammar in English.",
    inquiryQuestion: "If 'me llamo' means 'I call myself,' could you technically call yourself anything? Is a name a fact or a choice?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },

  // ===== SPANISH - Deck 2: Adjectives, Family, La Casa =====
  {
    id: "sq16", front: "Your friend is always knocking things over and tripping. Which Spanish adjective describes them?", back: "torpe",
    answerType: "multiple-choice",
    choices: ["torpe", "fuerte", "valiente", "travieso"],
    explanation: "'Torpe' = clumsy/awkward. 'Fuerte' = strong, 'valiente' = brave, 'travieso' = mischievous. Torpe describes physical clumsiness or social awkwardness.",
    realWorldConnection: "In the movie Encanto, Mirabel sometimes feels 'torpe' compared to her gifted family. This word comes up a lot when describing characters in telenovelas.",
    tokConnection: "Is clumsiness a personality trait or a physical characteristic? Spanish uses the same word 'torpe' for both physical AND intellectual awkwardness. Does one word for both suggest they're seen as connected?",
    interdisciplinary: "Psychology: motor coordination and social confidence are actually linked in development. Biology: the cerebellum controls both physical coordination and some aspects of social processing. 'Torpe' captures a real neural connection.",
    inquiryQuestion: "Can someone be physically graceful but socially 'torpe'? If so, should there be two different words? What's lost by combining them?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq17", front: "Describe someone who is happy in Spanish. The adjective does NOT change with gender.", back: "feliz",
    answerType: "type",
    explanation: "'Feliz' is the same for masculine AND feminine (el chico feliz, la chica feliz). Most adjectives ending in a consonant or -e don't change gender. Compare: 'contento/contenta' which DOES change.",
    realWorldConnection: "The phrase '¡Feliz cumpleaños!' (Happy birthday!) uses this word. You'll hear 'feliz' in songs, birthday cards, and holiday greetings constantly.",
    tokConnection: "Some Spanish adjectives change with gender (bonito/bonita) and some don't (feliz, optimista). Is happiness truly gender-neutral in a way that beauty isn't? Does grammar reflect cultural assumptions about which traits are gendered?",
    interdisciplinary: "Psychology: research shows men and women report similar levels of happiness, supporting 'feliz' being gender-neutral. But 'bonita' (pretty) is gendered — beauty IS treated differently by gender across cultures.",
    inquiryQuestion: "Why is 'feliz' gender-neutral but 'bonito/bonita' gendered? Did the language decide happiness belongs equally to everyone but beauty is different for men vs women?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq18", front: "'Estricta' describes a teacher who is lenient and easygoing.", back: "false",
    answerType: "true-false",
    trueFalseStatement: "'Estricta' describes a teacher who is lenient and easygoing.",
    trueFalseAnswer: false,
    explanation: "'Estricta' = strict, demanding, rigid about rules. The opposite would be 'relajada' (relaxed) or 'flexible.' Note the -a ending indicates describing a female teacher.",
    realWorldConnection: "Students might describe a teacher as 'La profesora Fawson es estricta pero justa' (strict but fair). It's not always negative — structure helps learning.",
    tokConnection: "Is 'strict' inherently negative? In Spanish-speaking cultures, 'estricto/a' can be a compliment for parents and teachers — it means you care. Cultural context changes whether an adjective is positive or negative.",
    interdisciplinary: "Education: research shows 'warm demander' teachers (strict + caring) produce the best outcomes. The Spanish concept of 'estricta pero cariñosa' captures this ideal teacher profile.",
    inquiryQuestion: "Can the same person be described as 'estricta' by one student and 'justa' by another? Are personality adjectives facts about a person or opinions of the observer?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq19", front: "What is the Spanish word for your mother's mother?", back: "la abuela",
    answerType: "type",
    explanation: "'La abuela' = grandmother. 'El abuelo' = grandfather. 'Los abuelos' = grandparents. The diminutive 'abuelita' is an affectionate form used commonly in Latin America.",
    realWorldConnection: "In many Latino families, 'abuelita' is the heart of the household — she often lives with the family and helps raise grandchildren. The word carries deep cultural warmth.",
    tokConnection: "English has ONE word 'grandmother' for both sides of the family. Chinese has FOUR different words (maternal/paternal × grandmother/grandfather). Spanish has two (abuelo/abuela). Does vocabulary shape how we perceive family relationships?",
    interdisciplinary: "Sociology: in Latin American culture, multigenerational households are common — 'la abuela' often has daily childcare roles. Economics: this family structure reduces childcare costs. Geography: climate and housing design support extended family living.",
    inquiryQuestion: "If your mother's mother and father's mother have the same title ('abuela'), does that make the relationships feel more equal? In cultures with different words for each, do people feel closer to one side?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq20", front: "Your dad's brother is your ___. Your dad's sister is your ___.", back: "tío / tía",
    answerType: "fill-blank",
    blankSentence: "Your dad's brother is your ___. Your dad's sister is your ___.",
    explanation: "'El tío' = uncle, 'la tía' = aunt. In Spanish-speaking cultures, 'tío/tía' is also used affectionately for close family friends (even non-relatives). 'Los tíos' can mean 'aunt and uncle' or colloquially 'guys/folks' in Spain.",
    realWorldConnection: "In many Latino families, your parents' close friends are called 'tío' and 'tía' by children — the word extends beyond blood to chosen family.",
    tokConnection: "If non-relatives can be called 'tío/tía,' does the word define a biological relationship or a social one? Is family determined by blood or by role?",
    interdisciplinary: "Anthropology: 'fictive kinship' (calling non-relatives family terms) exists in many cultures. It strengthens community bonds. Biology: from an evolutionary view, only genetic relatives ARE family. Which definition is 'real'?",
    inquiryQuestion: "If you call your mom's best friend 'tía,' and she acts like family, IS she family? What makes someone 'really' your aunt — DNA or daily presence?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq21", front: "Which family member word means 'siblings' when combining brother and sister?", back: "los hermanos",
    answerType: "multiple-choice",
    choices: ["los hermanos", "los padres", "los primos", "los hijos"],
    explanation: "'Los hermanos' = siblings (brothers and sisters combined). Spanish uses the masculine plural to refer to mixed-gender groups: hermano + hermana = los hermanos. 'Los padres' = parents, 'los primos' = cousins, 'los hijos' = children (sons/daughters).",
    realWorldConnection: "When filling out school forms in Spanish, '¿Cuántos hermanos tienes?' means 'how many siblings do you have?' — not just brothers.",
    tokConnection: "Spanish uses masculine plural for mixed groups ('los hermanos' for siblings). Critics argue this makes women linguistically invisible. Supporters say it's just grammar. Can grammar be politically neutral?",
    interdisciplinary: "Linguistics: the 'generic masculine' debate is active in Spanish-speaking countries. Some use 'los hermanos y hermanas' or 'les hermanes' for inclusion. Language politics mirrors social politics.",
    inquiryQuestion: "If 'los hermanos' technically means 'the brothers' but is used for 'siblings,' does that privilege male as the default? Would creating a new neutral word solve the problem or create confusion?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq22", front: "You're describing where you cook meals at home. What room is this in Spanish?", back: "la cocina",
    answerType: "type",
    explanation: "'La cocina' = kitchen. Related: 'cocinar' = to cook, 'el cocinero/la cocinera' = cook/chef. The word family all shares the root 'cocin-' making them easy to remember together.",
    realWorldConnection: "In many Latin American homes, 'la cocina' is the social center — family gathers there while abuelita cooks. It's often the largest room, unlike American homes where the living room dominates.",
    tokConnection: "The verb 'cocinar' (to cook) and the room 'la cocina' (kitchen) share the same root. English separates them ('cook' vs 'kitchen'). Does having the same root word make the connection between action and place more intuitive?",
    interdisciplinary: "Architecture: Latin American kitchen design often features open layouts facing the living area — reflecting the kitchen's social role. Economics: 'cocina' is where family labor (often women's unpaid work) happens. The room name carries economic implications.",
    inquiryQuestion: "If 'la cocina' is both the room AND where the action of cooking happens, what does it mean when kitchens shrink in modern apartments? Does architecture change behavior, or behavior change architecture?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq23", front: "What is the difference between 'la habitación' and 'el cuarto'?", back: "both mean room/bedroom, but habitación is more formal",
    answerType: "multiple-choice",
    choices: ["both mean room/bedroom, but habitación is more formal", "habitación = bathroom, cuarto = bedroom", "habitación = living room, cuarto = bedroom", "they are completely different rooms"],
    explanation: "'La habitación' and 'el cuarto' both mean bedroom/room. 'Habitación' is more formal (used in hotels: '¿Tiene una habitación disponible?'). 'Cuarto' is casual/everyday. Other room words: 'la sala' (living room), 'la cocina' (kitchen), 'el comedor' (dining room).",
    realWorldConnection: "Hotel check-in: 'Necesito una habitación.' At home: 'Voy a mi cuarto.' Same concept, different register — like 'residence' vs 'place' in English.",
    tokConnection: "Two words for the same space — one formal, one casual. Does having register options for the same concept make a language richer or more confusing? English does this too: 'lavatory' vs 'bathroom' vs 'restroom.'",
    interdisciplinary: "Architecture: 'habitación' comes from Latin 'habitare' (to dwell) — same root as 'habitat.' Your bedroom IS your habitat. The word connects human domestic space to the biological concept of where an organism lives.",
    inquiryQuestion: "If 'habitación' shares a root with 'habitat,' is your bedroom truly your personal ecosystem? What does your room say about your 'species' of teenager?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq24", front: "Where in the house would you find 'la cama, las cortinas, y la lámpara' together?", back: "la habitación",
    answerType: "fill-blank",
    blankSentence: "La cama, las cortinas, y la lámpara are found together in ___.",
    explanation: "'La cama' = bed, 'las cortinas' = curtains, 'la lámpara' = lamp. These are bedroom furniture ('los muebles del dormitorio'). Other furniture: 'el sofá' (sofa) → sala, 'la mesa' (table) → comedor.",
    realWorldConnection: "When moving to a new place or shopping at IKEA, you organize purchases by room. Knowing which 'muebles' go in which 'habitación' is practical vocabulary for real life.",
    tokConnection: "We group objects by room, but the objects don't 'know' they belong somewhere. A lamp works anywhere. Is room-based organization natural (based on function) or arbitrary (based on convention)?",
    interdisciplinary: "Math: categorization and set theory — 'bedroom items' is a SET with membership rules. Design: interior designers use vocabulary precisely (a 'settee' is different from a 'sofa'). Precision in naming reflects expertise.",
    inquiryQuestion: "If you put a bed in the kitchen, is it still 'bedroom furniture'? Does an object's identity change based on location, or does it carry its identity with it?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "sq25", front: "The part of the house where family gathers to watch TV and relax is called ___.", back: "la sala",
    answerType: "fill-blank",
    blankSentence: "The family gathers to watch TV and relax in ___.",
    explanation: "'La sala' = living room. Related words: 'el sillón' (armchair), 'el sofá' (sofa), 'la televisión' (TV) are typically sala furniture. Some regions say 'el salón' or 'la sala de estar.'",
    realWorldConnection: "After dinner, '¡Vamos a la sala!' means let's go to the living room to hang out. In Latin American homes, la sala is often the most decorated room — for guests.",
    tokConnection: "Different Spanish-speaking countries use different words for 'living room': sala, salón, sala de estar, living. Language varies by region even within one language. Which version is 'correct' Spanish?",
    interdisciplinary: "Sociology: the living room's function varies culturally — in some Latino homes it's formal (for guests only), in others it's casual (daily family use). The same word can describe very different social spaces.",
    inquiryQuestion: "If 'la sala' is for guests in one culture and for daily family use in another, does the word mean the same thing? Can a word's definition depend on who's using it?",
    audioLang: "es-ES", subject: "spanish", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },

  // ===== ENGLISH =====
  {
    id: "e01", front: "What are the 5 parts of a plot diagram?", back: "exposition, rising action, climax, falling action, resolution",
    answerType: "type",
    explanation: "Think of it like a mountain: exposition is the flat ground, rising action is climbing up, climax is the peak, falling action is coming down, resolution is flat ground again.",
    realWorldConnection: "Every movie follows this: in Finding Nemo, the exposition introduces Marlin/Nemo, rising action is the search, climax is the tank escape, resolution is reunion.",
    tokConnection: "The 5-part plot structure comes from Aristotle (2,400 years ago). But many non-Western stories don't follow this arc (Japanese 'kishōtenketsu' has no conflict). Is 'good storytelling' universal or culturally constructed?",
    interdisciplinary: "Math: the plot diagram IS a function — rising action has positive slope, falling action has negative slope, and the climax is a maximum point. Biology: life cycles follow similar arcs (birth → growth → peak → decline).",
    inquiryQuestion: "Social media stories (TikTok, Reels) are 15-60 seconds. Can they have all 5 plot elements? Has technology changed what storytelling IS, or just compressed it?",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e02", front: "The ___ is the turning point or most intense moment in a story.", back: "climax",
    answerType: "fill-blank",
    blankSentence: "The ___ is the turning point or most intense moment in a story.",
    explanation: "The climax is where everything changes — the main character faces their biggest challenge. After the climax, you know whether they'll succeed or fail.",
    realWorldConnection: "In a basketball game, the climax is the final shot that decides the winner. Everything before was building up to that moment.",
    tokConnection: "We identify the climax AFTER reading the whole story. Can you identify it while inside the moment? In your own life, do you recognize turning points as they happen, or only in hindsight?",
    interdisciplinary: "Psychology: peak emotional experiences follow the same arc — anticipation builds, peaks, then subsides. Music: symphonies build to a crescendo (musical climax). The pattern transcends medium.",
    inquiryQuestion: "Can a story have TWO climaxes? What about a story with NO climax (like 'Waiting for Godot' where nothing happens)? Does it stop being a 'story' if it breaks the rules?",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e03", front: "A simile uses 'like' or 'as' to compare two things.", back: "true",
    answerType: "true-false",
    trueFalseStatement: "A simile uses 'like' or 'as' to compare two things.",
    trueFalseAnswer: true,
    explanation: "Simile = uses 'like' or 'as'. Metaphor = direct comparison WITHOUT like/as. 'She is LIKE a rose' (simile) vs 'She IS a rose' (metaphor).",
    realWorldConnection: "Song lyrics are full of similes: 'Float like a butterfly, sting like a bee' (Muhammad Ali). Metaphors too: 'Life is a highway.'",
    tokConnection: "Similes say X is LIKE Y. Metaphors say X IS Y. Both are literally false ('she is not actually a rose'). How can false statements communicate truth? What kind of knowledge does figurative language carry?",
    interdisciplinary: "Science: models and analogies ARE similes ('an atom is LIKE a solar system'). Math: equations are metaphors ('this expression IS that value'). Figurative thinking drives discovery across all fields.",
    inquiryQuestion: "AI can generate similes ('love is like a river') but does it understand WHY the comparison works? What's the difference between pattern-matching and genuine creative insight?",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e04", front: "What is foreshadowing?", back: "hints or clues about what will happen later",
    answerType: "multiple-choice",
    choices: ["hints or clues about what will happen later", "a flashback to an earlier event", "the moral of the story", "the narrator's point of view"],
    explanation: "Authors plant foreshadowing so events don't feel random. Example: mentioning a storm brewing early in a story before a disaster strikes later.",
    realWorldConnection: "In horror movies, creepy music foreshadows something bad is about to happen — your brain picks up the clue before the scare.",
    tokConnection: "Foreshadowing only works because humans are pattern-seeking. We WANT to find connections between events. Is finding 'clues' in a text evidence of meaning the author put there, or meaning WE project onto it?",
    interdisciplinary: "Science: early warning signs of disease are medical 'foreshadowing.' History: historians identify 'foreshadowing' of wars after the fact. Is this genuine pattern or hindsight bias?",
    inquiryQuestion: "When you reread a book, you 'see' foreshadowing you missed the first time. Did the foreshadowing exist on your first read? Can meaning exist before someone perceives it?",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e05", front: "What is the difference between protagonist and antagonist?", back: "protagonist is the main character; antagonist opposes them",
    answerType: "type",
    explanation: "Pro = for, Anti = against. The protagonist drives the story forward. The antagonist creates conflict. An antagonist isn't always a 'villain' — it can be nature, society, or the protagonist's own mind.",
    realWorldConnection: "In your life, procrastination can be an 'antagonist' — it opposes your goal of getting good grades.",
    tokConnection: "Stories have protagonists and antagonists. But in real conflicts (wars, arguments), BOTH sides see themselves as the protagonist. Can we ever objectively identify who is 'the hero' vs 'the villain'?",
    interdisciplinary: "History: textbooks make one side the protagonist (usually the winner). Biology: immune cells are 'protagonists' fighting virus 'antagonists' — but from the virus's perspective, it's just trying to survive.",
    inquiryQuestion: "Tell the story of Little Red Riding Hood from the wolf's perspective. Does the protagonist/antagonist flip? What does this teach us about how perspective shapes narrative truth?",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e06", front: "What is theme?", back: "the central message or lesson of a story",
    answerType: "multiple-choice",
    choices: ["the central message or lesson of a story", "the main events of the plot", "the setting and time period", "the author's biography"],
    explanation: "Theme is NEVER stated directly — you infer it. It's expressed as a full sentence, not one word. Not 'love' but 'True love requires sacrifice.'",
    realWorldConnection: "The theme of most superhero movies is 'With great power comes great responsibility' — you figure it out from what happens, not from someone saying it.",
    tokConnection: "Two readers can find DIFFERENT themes in the same book. Is the 'real' theme what the author intended, or what the reader discovers? Can a text mean something its author didn't intend?",
    interdisciplinary: "Science: data has no inherent 'theme' — scientists interpret patterns and construct meaning. Math: proofs have 'themes' (contradiction, induction) that aren't stated but emerge from structure.",
    inquiryQuestion: "If a 5-year-old and a college professor read the same picture book, they'll identify different themes. Which one is 'correct'? Does the meaning of art depend on who's experiencing it?",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },

  // ===== ENGLISH - PSAT/SAT Vocabulary =====
  {
    id: "e07", front: "ambiguous", back: "having more than one possible meaning; unclear",
    answerType: "type",
    explanation: "Ambi- means 'both' (like ambidextrous = both hands). Ambiguous = could go BOTH ways. Opposite: unambiguous, explicit, clear.",
    realWorldConnection: "Texts are ambiguous: 'Sure.' — are they being sincere or sarcastic? The SAT tests whether you can identify ambiguity in passages.",
    tokConnection: "Scientists avoid ambiguity; poets embrace it. Is ambiguity a flaw in communication or a feature? Can a statement be more truthful BECAUSE it holds multiple meanings?",
    interdisciplinary: "Math: ambiguous equations have multiple solutions (x² = 4 → x = 2 OR -2). Law: ambiguous contracts lead to lawsuits. Science: ambiguous data requires more experiments. Every field handles uncertainty differently.",
    inquiryQuestion: "Is the sentence 'I saw the man with the telescope' ambiguous? (Who has the telescope?) How does context resolve ambiguity that grammar cannot?",
    exampleSentence: "The politician's ambiguous statement left voters unsure of her actual position.",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e08", front: "pragmatic", back: "dealing with things in a practical, realistic way",
    answerType: "multiple-choice",
    choices: ["dealing with things in a practical, realistic way", "relating to dreams and imagination", "extremely emotional and dramatic", "following strict rules without exception"],
    explanation: "Pragmatic people focus on WHAT WORKS rather than what's ideal. Opposite: idealistic, theoretical, impractical. From Greek 'pragma' = deed/action.",
    realWorldConnection: "A pragmatic approach to studying: 'I have 2 hours, what gives me the most points?' vs idealistic: 'I should understand everything perfectly.'",
    tokConnection: "Pragmatism says 'truth is what works.' But something can work without being true (a wrong scientific model can still make useful predictions). Is practical success the same as truth?",
    interdisciplinary: "Philosophy: Pragmatism is an American philosophy (William James, John Dewey) that judges ideas by their results. Economics: 'rational actors' are pragmatic by definition. Science: peer review is pragmatic — keep what works, discard what doesn't.",
    inquiryQuestion: "Is it pragmatic to cheat on a test if you get a good grade? Where does pragmatism end and ethics begin? Can 'what works' ever be wrong?",
    exampleSentence: "The mayor took a pragmatic approach, choosing the affordable solution over the perfect one.",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e09", front: "ubiquitous", back: "present everywhere at the same time",
    answerType: "type",
    explanation: "From Latin 'ubique' = everywhere. Synonyms: omnipresent, pervasive, universal. If something is ubiquitous, you can't escape it no matter where you go.",
    realWorldConnection: "Smartphones are ubiquitous — try finding a public space without someone looking at a screen. WiFi has become ubiquitous in cities.",
    tokConnection: "If something is truly ubiquitous, can we still notice it? Fish don't notice water. What ubiquitous things in YOUR life are invisible to you precisely because they're everywhere?",
    interdisciplinary: "Biology: oxygen is ubiquitous in Earth's atmosphere but wasn't always — early Earth had almost none. Technology: the goal of 'ubiquitous computing' is tech so embedded you forget it's there.",
    inquiryQuestion: "Plastic is now ubiquitous — it's in oceans, soil, and even human blood. At what point does 'everywhere' become a problem rather than a convenience?",
    exampleSentence: "Coffee shops have become ubiquitous in urban areas.",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e10", front: "undermine", back: "to weaken or damage gradually",
    answerType: "fill-blank",
    blankSentence: "The constant criticism began to ___ her confidence over time.",
    explanation: "Literally: to dig under (mine) a foundation until it collapses. Figuratively: to slowly weaken something from within. Opposite: strengthen, reinforce, bolster.",
    realWorldConnection: "Skipping homework doesn't fail you immediately — it undermines your understanding gradually until the test reveals the damage. It's invisible erosion.",
    tokConnection: "Undermining is invisible until the collapse. How do we detect slow, gradual damage to knowledge, relationships, or institutions? Is there a point of no return that we can identify in advance?",
    interdisciplinary: "Geology: water undermines cliffs until they collapse (erosion). Biology: chronic stress undermines immune function over months. History: propaganda undermines public trust. The pattern of invisible gradual damage appears in every domain.",
    inquiryQuestion: "Can you undermine something unintentionally? If you spread misinformation you believe is true, are you 'undermining' truth? Does intent matter for the word's meaning?",
    exampleSentence: "The scandal undermined public trust in the institution.",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e11", front: "substantiate", back: "to provide evidence to support a claim",
    answerType: "type",
    explanation: "Sub + stance = to give 'substance' to an argument. If you can't substantiate a claim, it's just an opinion. Synonyms: verify, corroborate, confirm, validate.",
    realWorldConnection: "On the SAT Reading section, you must substantiate your answer with TEXT EVIDENCE — the exact line that proves your interpretation. No evidence = wrong answer.",
    tokConnection: "What counts as 'substantiation'? In science it's data; in law it's testimony; in history it's primary sources; in math it's proof. Each discipline has different standards for what makes evidence sufficient.",
    interdisciplinary: "Science: hypotheses must be substantiated by reproducible experiments. Law: 'innocent until proven guilty' means the prosecution must substantiate charges. Math: conjectures become theorems only when substantiated by proof.",
    inquiryQuestion: "Social media lets anyone make claims without substantiation. Has technology undermined (see — vocab connection!) our standards for evidence? How much evidence should we require before believing something?",
    exampleSentence: "The researcher could not substantiate her theory with experimental data.",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e12", front: "paradox", back: "a statement that seems contradictory but reveals a truth",
    answerType: "multiple-choice",
    choices: ["a statement that seems contradictory but reveals a truth", "a statement that is always false", "a comparison between two things", "a prediction about the future"],
    explanation: "Para- (beyond) + doxa (opinion). A paradox goes BEYOND normal logic. Example: 'The only constant is change.' It contradicts itself on the surface but captures something real.",
    realWorldConnection: "'The more you study, the more you realize how much you don't know.' — that's a paradox. Feeling MORE ignorant is actually a sign of GROWING knowledge.",
    tokConnection: "Paradoxes break logic but illuminate truth. 'This statement is false' — if it's true, it's false; if it's false, it's true. Can something be true AND false simultaneously? What does this mean for the nature of truth?",
    interdisciplinary: "Physics: light is both a wave AND a particle (wave-particle duality) — a scientific paradox. Math: Zeno's paradox says motion is impossible, yet we move. Biology: too much of a good thing (oxygen, vitamins) becomes toxic.",
    inquiryQuestion: "The 'paradox of choice' says MORE options make us LESS happy. If this is true, should schools offer fewer electives? When does freedom become a burden?",
    exampleSentence: "It's a paradox that standing still in a fast-moving world can be the bravest act.",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e13", front: "ephemeral", back: "lasting for a very short time",
    answerType: "type",
    explanation: "From Greek 'ephemeros' = lasting only a day. Synonyms: fleeting, transient, momentary. Opposite: permanent, enduring, eternal. Often used for beauty, trends, or emotions that fade quickly.",
    realWorldConnection: "Instagram Stories are designed to be ephemeral — they disappear in 24 hours. Snapchat built an entire app around ephemeral messages.",
    tokConnection: "If something is ephemeral, does it have less value than something permanent? Cherry blossoms are celebrated BECAUSE they're ephemeral. Does impermanence increase or decrease meaning?",
    interdisciplinary: "Biology: mayflies live for only 24 hours as adults — the most ephemeral lifespan of any animal. Art: ice sculptures and sand mandalas are intentionally ephemeral art forms. Economics: trends and fads are ephemeral markets.",
    inquiryQuestion: "Buddhist monks spend weeks building intricate sand mandalas, then deliberately destroy them. Why? What does choosing to make art ephemeral teach about attachment and impermanence?",
    exampleSentence: "The beauty of the sunset was ephemeral, lasting only minutes before darkness fell.",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e14", front: "empirical", back: "based on observation or experience rather than theory",
    answerType: "multiple-choice",
    choices: ["based on observation or experience rather than theory", "based purely on logical reasoning", "based on emotional intuition", "based on majority opinion"],
    explanation: "Empirical knowledge comes from EVIDENCE you can observe, measure, or test. Opposite: theoretical, speculative, hypothetical. The scientific method is empirical at its core.",
    realWorldConnection: "When a doctor says 'empirically, this treatment works,' they mean 'we've observed it working in real patients' — not just 'it should work in theory.'",
    tokConnection: "Empiricism says all knowledge comes from sensory experience. But can you empirically prove that empiricism is correct? (You'd need non-empirical reasoning to do so.) This is the foundational paradox of science.",
    interdisciplinary: "Science: empirical evidence is the gold standard. Math: math is NOT empirical — you prove things with logic, not observation. Philosophy: the empiricism vs rationalism debate has shaped all Western thought since the 1600s.",
    inquiryQuestion: "You can't empirically observe an electron — only its effects. You can't empirically observe love — only behaviors that suggest it. At what point does 'inference from effects' stop being empirical?",
    exampleSentence: "The study provided empirical evidence that sleep improves memory retention.",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e15", front: "inevitable", back: "certain to happen; unavoidable",
    answerType: "fill-blank",
    blankSentence: "Given the evidence of climate change, scientists say some level of warming is now ___.",
    explanation: "In- (not) + evitable (avoidable) = NOT avoidable. If something is inevitable, no action can prevent it. Synonyms: unavoidable, inescapable, certain. Opposite: avoidable, preventable, unlikely.",
    realWorldConnection: "Death and taxes are 'inevitable' (Ben Franklin). On the SAT, authors use 'inevitable' to signal that a consequence CANNOT be stopped — it's the strongest form of prediction.",
    tokConnection: "If something is truly inevitable, does free will matter? If climate change is 'inevitable,' does that mean we should stop trying? How does labeling something 'inevitable' change human behavior toward it?",
    interdisciplinary: "Physics: entropy (disorder) increasing is thermodynamically inevitable. History: was WWII 'inevitable' given the Treaty of Versailles? Math: in probability, P=1 events are inevitable. But in history, is anything truly P=1?",
    inquiryQuestion: "People often say 'change is inevitable.' But is it? Can you name something that has NEVER changed? If everything changes, is the statement 'change is inevitable' itself subject to change?",
    exampleSentence: "With the team's injuries mounting, their playoff elimination seemed inevitable.",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
  {
    id: "e16", front: "advocate", back: "to publicly support or recommend",
    answerType: "type",
    explanation: "As a verb: to speak in favor of something. As a noun: a person who supports a cause. From Latin 'advocare' = to call to one's aid. Synonyms: champion, promote, endorse.",
    realWorldConnection: "Greta Thunberg advocates for climate action. On the SAT, 'the author advocates' means the author is ARGUING FOR a position — it signals the passage's main claim.",
    tokConnection: "Can you advocate for something and still be objective? Journalists are supposed to be neutral, but advocacy journalism argues a position. Is pure objectivity possible, or does everyone advocate implicitly?",
    interdisciplinary: "Law: an 'advocate' is literally a lawyer (someone who speaks for you). Biology: scientists who advocate for conservation face criticism for 'bias.' Spanish: 'abogado' (lawyer) comes from the same Latin root as advocate.",
    inquiryQuestion: "If a scientist discovers that a chemical is dangerous and then advocates for banning it — have they stopped being a scientist and become an activist? Can one person be both?",
    exampleSentence: "She advocates for equal access to education in underserved communities.",
    audioLang: "en-US", subject: "english", easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date()
  },
];
