// Original practice prompts informed by the ACTFL OPIc Familiarization Guide and public test-taker accounts.
export const TOPICS = [
  {
    id: "home",
    label: "집",
    group: "생활",
    description:
      "Which room do you spend the most time in at home? What would I see if I walked in?",
    routine:
      "What do you do at home after a long day? Take me through your evening from the moment you open the door.",
    past: "Tell me about something in your home that broke. How did you get by until it was fixed?",
    comparison:
      "How does your home today compare with the place you lived in as a child? Think about how you used the space.",
    opinion:
      "What would you change about your home to make daily life easier? Give me an example of when that change would help.",
    otherPast:
      "Tell me about an item you brought home that changed the way you use a room. How did you end up with it?",
  },
  {
    id: "neighborhood",
    label: "동네",
    group: "생활",
    description:
      "Where do people in your neighborhood gather? Describe the place on a busy day.",
    routine:
      "What errands do you usually run close to home? Tell me where you stop along the way.",
    past: "When did someone in your neighborhood help you out? Tell me what happened between you.",
    comparison:
      "How is your neighborhood different at night? Compare the streets and the people you see with what you see during the day.",
    opinion:
      "What is one thing your neighborhood needs? Who would use it and why?",
    otherPast:
      "Tell me about discovering a place near home that you had never noticed before. What brought you there?",
  },
  {
    id: "cafe",
    label: "카페 가기",
    group: "여가",
    description:
      "Describe a café where you like to spend time. Where do you sit, and what can you see or hear from there?",
    routine:
      "How do you decide what to order at a café? Tell me how you usually place your order.",
    past: "Tell me about a café visit when your order got mixed up. What did you say, and how did it turn out?",
    comparison:
      "How does a café you go to alone differ from one you would choose for a group? Compare the spaces and the atmosphere.",
    opinion:
      "Should a small café set a time limit on tables when it gets busy? Tell me how that would affect someone spending an afternoon there.",
    otherPast:
      "When did you last try an unfamiliar drink? Tell me what made you order it and how it tasted.",
  },
  {
    id: "movies",
    label: "영화 보기",
    group: "여가",
    description:
      "Tell me about a movie character you remember well. What is this person like on screen?",
    routine:
      "How do you and a friend pick a movie to watch together? Walk me through how you settle on a title.",
    past: "Tell me about a film that surprised you. What were you expecting when you started it?",
    comparison:
      "Compare watching a movie at home with seeing it in a theater. Think of a scene that feels different on a big screen.",
    opinion:
      "Which kinds of movies are worth a trip to the theater for you? Explain what you get out of seeing one there.",
    otherPast:
      "Tell me about a film you recommended to someone. How did they react after watching it?",
  },
  {
    id: "music",
    label: "음악 감상",
    group: "취미",
    description:
      "What does a song you love sound like? Describe it to someone who has never heard the artist.",
    routine:
      "When do you put music on during a typical day? Tell me how you pick something to suit the moment.",
    past: "Tell me about a song you associate with a particular day. Where were you when you heard it?",
    comparison:
      "Compare the music you listen to now with what you played a few years ago. How did a new artist or style find its way into your life?",
    opinion:
      "How well does a music app know your taste? Give me an example of a recommendation that worked or missed the mark.",
    otherPast:
      "How did you discover a musician you now listen to often? Take me back to that first encounter.",
  },
  {
    id: "concerts",
    label: "공연·콘서트",
    group: "여가",
    description:
      "Describe a venue where you have seen a show. What could you see and hear from your spot?",
    routine:
      "How do you get ready to see a live show? Tell me what you arrange before you leave home.",
    past: "Tell me about a moment when a crowd reacted during a performance. What did the performer do next?",
    comparison:
      "Compare a live performance with a recording of the same kind of music. What stands out in each?",
    opinion:
      "What makes a show worth the ticket price for you? Use a performance you know to explain.",
    otherPast:
      "Tell me how you ended up going to your first live show. What do you remember about arriving there?",
  },
  {
    id: "parks",
    label: "공원 가기",
    group: "여가",
    description:
      "If I met you at your favorite park, what landmark should I look for? Describe the area around it.",
    routine:
      "Where do you usually go once you enter the park? Talk me through one of your visits.",
    past: "Tell me about something you saw in a park that made you stop. What was going on?",
    comparison:
      "How do children and older visitors use a park you know? Describe what each group does there.",
    opinion:
      "What problem do visitors face in a park near you? Tell me what you would ask the city to do about it.",
    otherPast:
      "Tell me about a park visit that lasted longer than you expected. What kept you there?",
  },
  {
    id: "walking",
    label: "걷기",
    group: "운동",
    description:
      "Describe a stretch of road you like walking along. What do you pass on the way?",
    routine:
      "How do you fit walking into an ordinary day? Tell me when you head out and how you decide when to turn back.",
    past: "Tell me about a time you took a wrong turn on foot. Where did you end up?",
    comparison:
      "Compare walking alone with walking alongside someone else. What changes about your pace or route?",
    opinion:
      "What would make your streets better for people on foot? Describe a spot where that improvement would matter.",
    otherPast:
      "When did you find a shortcut or a new walking route? Tell me how you discovered it.",
  },
  {
    id: "running",
    label: "조깅",
    group: "운동",
    description:
      "Where do you like to jog? Describe the ground and the stretch you find hardest.",
    routine:
      "How do you pace yourself on a normal run? Talk me through the beginning and the end.",
    past: "Tell me about a run you had to cut short. What made you stop and what did you do next?",
    comparison:
      "How is running outdoors different from using a treadmill? Compare how you feel during each.",
    opinion:
      "What advice would you give someone going out for their first jog? Explain why that advice matters to you.",
    otherPast:
      "Tell me about a running goal you worked toward. What happened on the day you tried to reach it?",
  },
  {
    id: "fitness",
    label: "헬스·운동",
    group: "운동",
    description:
      "Describe the place where you exercise. Which piece of equipment or part of the space do you use most?",
    routine:
      "What does a normal workout look like for you? Explain how you get started and wind down.",
    past: "Tell me about learning an unfamiliar exercise. How did you figure out the movements?",
    comparison:
      "Compare an exercise class with working out on your own. What is easier or harder in each setting?",
    opinion:
      "What keeps people coming back to a gym after the first month? Draw on something you have seen or experienced.",
    otherPast:
      "Tell me about a day when someone helped you during a workout. How did the session go afterward?",
  },
  {
    id: "cooking",
    label: "요리하기",
    group: "취미",
    description:
      "What is a dish you like to make? Describe its taste and the ingredients that give it that flavor.",
    routine:
      "How do you make a simple meal you know well? Talk me through it as if I were cooking beside you.",
    past: "Tell me about a time a dish went wrong. When did you notice, and what did you end up eating?",
    comparison:
      "Compare your own version of a dish with someone else's. What do you do differently, and how does it taste?",
    opinion:
      "Is it worth cooking from scratch on a busy night? Tell me how you decide in your own kitchen.",
    otherPast:
      "When did you first cook for someone else? Tell me what you served and how the meal went.",
  },
  {
    id: "shopping",
    label: "쇼핑",
    group: "생활",
    description:
      "Describe a shop you know well enough to find things without asking. What is near the entrance and what is farther inside?",
    routine:
      "How do you decide whether to buy something expensive? Take me through the steps before you pay.",
    past: "Tell me about a purchase you regretted. What happened when you tried to use it?",
    comparison:
      "Compare buying clothes online with trying them on in a shop. How do you choose in each case?",
    opinion:
      "What makes you trust a review when you shop? Give me an example of a detail that would influence you.",
    otherPast:
      "Tell me about a time you found exactly what you needed in an unexpected place. How did you come across it?",
  },
  {
    id: "travel",
    label: "국내 여행",
    group: "여행",
    description:
      "Where would you take a visitor on a short trip in your country? Describe a sight they would remember.",
    routine:
      "How do you plan a weekend away? Tell me what you book ahead and what you leave open.",
    past: "Tell me about a domestic trip that took an unexpected turn. What did you end up doing that day?",
    comparison:
      "Compare two places you have visited in your country. What kind of traveler would enjoy each?",
    opinion:
      "How could a popular destination welcome visitors while keeping life comfortable for residents? Use a place you know as an example.",
    otherPast:
      "Tell me about a meal you still remember from a trip. How did you find the place that served it?",
  },
  {
    id: "overseas",
    label: "해외 여행",
    group: "여행",
    description:
      "Describe a place abroad you would like to explore. What draws you to that particular place?",
    routine:
      "What would you check before leaving for another country? Explain how you would get ready for arrival.",
    past: "Tell me about a time you had trouble communicating with someone while traveling or helping a visitor. How did you understand each other?",
    comparison:
      "Compare planning a trip abroad with planning one close to home. Which arrangements take more thought?",
    opinion:
      "Would you spend a week in one foreign city or move between several? Explain what you would gain and give up.",
    otherPast:
      "Tell me about a time you learned a custom from another country. What happened when you first came across it?",
  },
  {
    id: "staycation",
    label: "집에서 휴가",
    group: "여행",
    description:
      "Where in your home do you most enjoy spending a day off? Describe what makes the space comfortable.",
    routine:
      "How do you spend the first morning of a vacation at home? Tell me how the rest of the day usually unfolds.",
    past: "Tell me about a day off at home that you still remember. What made it feel like a vacation?",
    comparison:
      "How does a holiday at home differ from an ordinary weekend for you? Compare what you make time for.",
    opinion:
      "What would you say to a friend who thinks staying home is a wasted vacation? Use an example from your life.",
    otherPast:
      "Tell me about a time you canceled an outing and stayed home. How did the day turn out?",
  },
  {
    id: "beach",
    label: "해변 가기",
    group: "여가",
    description:
      "Describe a beach you know. What do you notice first when you get down to the water?",
    routine:
      "What do you take to the beach? Tell me how you set up once you arrive.",
    past: "Tell me about a beach visit when the weather or the water surprised you. What did you do?",
    comparison:
      "How does a busy beach in summer compare with the shore on a quiet day? Describe what you can do at each time.",
    opinion:
      "What should a town do about litter on a popular beach? Explain how your idea would work on a crowded day.",
    otherPast:
      "Tell me about something you found or saw by the water. What were you doing just before you noticed it?",
  },
  {
    id: "reading",
    label: "독서",
    group: "취미",
    description:
      "Tell me about a book you would lend to a friend. What would you tell them about it without giving away the ending?",
    routine:
      "How do you pick your next book? Tell me what you look at before deciding to read on.",
    past: "Tell me about a book you nearly stopped reading. What made you put it down or keep going?",
    comparison:
      "Compare reading on a screen with reading a printed book. When does each suit you best?",
    opinion:
      "What would get more people to use a local library? Describe a service you would make room for.",
    otherPast:
      "Tell me about a book someone chose for you. How did your reaction compare with what they expected?",
  },
  {
    id: "games",
    label: "게임",
    group: "취미",
    description:
      "Describe a game to someone who has never played it. What is the player trying to do?",
    routine:
      "How do you start a typical gaming session? Tell me how you choose a game and decide when to stop.",
    past: "Tell me about a game that came down to the last move. What happened and how did it end?",
    comparison:
      "How is playing with other people different from playing alone? Compare the decisions you make.",
    opinion:
      "What makes a game fair for newcomers playing against experienced players? Use a game you know to explain.",
    otherPast:
      "Tell me about a mistake you made while learning a game. What did it teach you about the rules?",
  },
  {
    id: "work",
    label: "직장 생활",
    group: "생활",
    description:
      "What is your workplace like when people first arrive? Describe where people work and how they interact.",
    routine:
      "How do you decide what to tackle first at work? Walk me through the start of a typical workday.",
    past: "Tell me about a time a colleague helped you finish a difficult task. What did each of you do?",
    comparison:
      "Compare the way colleagues communicate now with the way they did when you started. What difference has that made?",
    opinion:
      "What would make meetings more useful at your workplace? Describe a change and who it would help.",
    otherPast:
      "What do you remember about your first day at work? Tell me about one moment in particular.",
  },
  {
    id: "study",
    label: "학교 생활",
    group: "생활",
    description:
      "Describe a class you remember clearly. What was the room like and what did the teacher do?",
    routine:
      "How do you prepare for a difficult class? Tell me what you do before and after the lesson.",
    past: "Tell me about a group project that did not go as planned. How did the group finish the work?",
    comparison:
      "Compare learning something online with learning it in a classroom. When do you find each more helpful?",
    opinion:
      "What should a teacher consider when assigning group work? Explain using a class you know.",
    otherPast:
      "Tell me about a time something finally made sense in class. What helped you understand it?",
  },
  {
    id: "sns",
    label: "SNS 사용",
    group: "여가",
    description:
      "Describe the kind of post that makes you pause while scrolling. What catches your eye?",
    routine:
      "How do you decide what to share online? Talk me through what happens before a post goes up.",
    past: "Tell me about something you learned about through a post. What did you do after seeing it?",
    comparison:
      "Compare how you keep up with close friends online and in person. What kinds of things do you hear about in each setting?",
    opinion:
      "What should someone check before passing along a popular post? Explain what could happen if they skip that step.",
    otherPast:
      "Tell me about a conversation that began with something someone posted. Where did the conversation lead?",
  },
  {
    id: "people",
    label: "가족·친구",
    group: "생활",
    description:
      "Tell me about someone you enjoy spending time with. What do they do that shows you their personality?",
    routine:
      "How do you make time for someone close to you? Tell me what the two of you usually do together.",
    past: "Tell me about a time a friend or relative surprised you. How did you react?",
    comparison:
      "How has one of your friendships changed since you first met? Compare the things you shared then with what you share now.",
    opinion:
      "What helps two people stay close when they live far apart? Give me an example you have seen.",
    otherPast:
      "Tell me the story of meeting someone who later became important to you. What do you remember about that first conversation?",
  },
  {
    id: "jobsearch",
    label: "취업 준비",
    group: "생활",
    description:
      "What kind of job would you like to try? Describe what a person in that role does on an ordinary day.",
    routine:
      "How would you prepare for a job interview? Explain how you would practice before meeting the interviewer.",
    past: "Tell me about a time you introduced yourself to make a good impression. What happened afterward?",
    comparison:
      "Compare finding a job through someone you know with applying to a listing. What information do you get each way?",
    opinion:
      "Which would matter more to you in a first job, guidance or independence? Explain how it would affect your work.",
    otherPast:
      "Tell me about a piece of career advice someone gave you. What did you do with it?",
  },
] as const;
export const UNEXPECTED_TOPICS = [
  {
    id: "technology",
    label: "기술",
    description:
      "Which device do you reach for most often? Describe a feature you would miss if it disappeared.",
    routine:
      "How do you use your phone to find an unfamiliar address? Walk me through what you do before and during the trip.",
    past: "Tell me about a device failing just when you needed it. How did you finish what you were doing?",
    comparison:
      "Compare how you found information before you had a smartphone with how you find it today. What has become easier or harder?",
    opinion:
      "Which everyday service should still offer a way to use it without a smartphone? Tell me who would benefit and why.",
  },
  {
    id: "transport",
    label: "교통",
    description:
      "Describe a route people use to get around your area. Where does it go and what is the ride like?",
    routine:
      "How do you get to a place you visit regularly? Talk me through the journey from your front door.",
    past: "Tell me about a trip when a bus, train or ride failed to arrive on time. How did you reach your destination?",
    comparison:
      "Compare two ways of getting across your town at rush hour. When would you choose each one?",
    opinion:
      "What single change would make local transportation more useful? Describe a journey that would improve.",
  },
  {
    id: "weather",
    label: "날씨",
    description:
      "Which season would a visitor notice most in your country? Describe a typical day outdoors at that time of year.",
    routine:
      "What do you check before going out on a rainy day? Tell me how the forecast affects your plans.",
    past: "Tell me about a time the weather changed in the middle of an outing. What happened to your plans?",
    comparison:
      "Compare a winter day where you live with a summer day. How does the weather change what people do?",
    opinion:
      "How should an organizer decide whether to call off an outdoor event because of the weather? Explain what you would consider.",
  },
  {
    id: "recycling",
    label: "재활용",
    description:
      "Where do people take recyclable items near your home? Describe the collection area to a new neighbor.",
    routine:
      "How do you get empty food containers ready for collection? Talk me through what you do from the kitchen to the bin.",
    past: "Tell me about an item you were unsure how to dispose of. How did you find out where it belonged?",
    comparison:
      "Compare recycling where you live now with what you remember growing up. What does a household have to do differently?",
    opinion:
      "What part of recycling confuses people in your area? Suggest a change that would make sorting easier.",
  },
  {
    id: "appointments",
    label: "약속",
    description:
      "What kinds of appointments do you make regularly? Tell me who you meet and where you go.",
    routine:
      "How do you book a haircut or another service you use? Tell me how you choose a time and remember it.",
    past: "Tell me about an appointment you almost missed. What delayed you and how did the other person respond?",
    comparison:
      "Compare booking online with calling someone to arrange a time. When is it easier to speak to a person?",
    opinion:
      "What should a business do when someone is late for an appointment? Explain how you would handle the people waiting.",
  },
  {
    id: "health",
    label: "건강",
    description:
      "What is one meal or snack that helps you feel good? Describe what goes into it and when you have it.",
    routine:
      "How do you make room for a healthy habit on a working day? Take me through the part of the day when you do it.",
    past: "Tell me about trying to change a habit for your health. What happened the first week?",
    comparison:
      "Compare how you take care of yourself during a busy week with a quieter week. Which habit changes the most?",
    opinion:
      "What could a workplace or school do to help people stay active? Explain how someone would use your idea during a normal day.",
  },
] as const;
