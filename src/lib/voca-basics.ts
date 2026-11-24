import { practiceEntries, type VocaGrade } from "./voca-practice-entries";

// These are editorial practice groups. The official guides describe speaking tasks.
function level(
  grade: VocaGrade,
  focus: string,
  entries: [string, string, string, ...string[]][],
) {
  return {
    grade,
    focus,
    words: [
      ...entries,
      ...practiceEntries[grade].map(
        ([english, , meaning, example]): [string, string, string] => [
          english,
          meaning,
          example,
        ],
      ),
    ].map(([english, meaning, example, ...alternatives]) => ({
      english,
      meaning,
      example,
      alternatives,
    })),
  };
}

export const VOCA_BASIC_BOOKS = [
  level("IL", "나와 일상 소개하기", [
    ["usually", "평소에는, 대개", "I usually walk to work."],
    [
      "nearby",
      "멀지 않은 곳에, 근처에",
      "My sister lives nearby, so we eat together a lot.",
    ],
    [
      "favorite",
      "여럿 중 가장 좋아하는",
      "My favorite spot is the bench by the river.",
      "favourite",
    ],
    [
      "weekend",
      "토요일과 일요일을 묶어 이르는 주말",
      "I visit my parents every weekend.",
    ],
    ["quiet", "소리가 적고 조용한", "My street is quiet at night."],
    [
      "busy",
      "할 일이 많아 바쁜",
      "I'm busy on Mondays, so I usually eat at my desk.",
    ],
    ["enjoy", "어떤 일을 하며 즐거움을 느끼다", "I enjoy cooking with my dad."],
    ["together", "다른 사람과 함께", "My roommate and I make dinner together."],
    ["alone", "다른 사람 없이 혼자", "I live alone in a small apartment."],
    ["hometown", "자기가 자란 고향", "My hometown is a small city by the sea."],
  ]),
  level("IM1", "습관과 취향 말하기", [
    [
      "routine",
      "늘 반복하는 일과",
      "Making coffee is part of my morning routine.",
    ],
    [
      "prefer",
      "둘 중 하나를 더 좋아하다",
      "I prefer walking to taking the bus.",
    ],
    ["often", "빈번하게, 자주", "I often call my brother on my way home."],
    [
      "rarely",
      "좀처럼 하지 않을 만큼 드물게",
      "I rarely drive because the subway is so close.",
    ],
    ["indoors", "건물 안에서, 실내에서", "When it rains, I exercise indoors."],
    ["relax", "긴장을 풀고 쉬다", "I relax by listening to music after work."],
    [
      "practice",
      "익숙해지도록 반복해서 연습하다",
      "I practice the guitar for ten minutes after dinner.",
      "practise",
    ],
    ["crowded", "사람이 많아 붐비는", "The market gets crowded on Saturdays."],
    [
      "comfortable",
      "몸이나 마음이 편안한",
      "I feel comfortable singing in front of my friends.",
    ],
    [
      "friendly",
      "다른 사람을 친근하게 대하는",
      "The owner is friendly and remembers my name.",
    ],
  ]),
  level("IM2", "이유와 구체적인 정보 덧붙이기", [
    [
      "because",
      "뒤에 이유를 붙일 때 쓰는 ‘왜냐하면’",
      "I keep going back because the owner makes me feel welcome.",
    ],
    [
      "especially",
      "여러 가지 중에서도 특히",
      "I love this park, especially in the fall.",
    ],
    [
      "convenient",
      "시간이나 수고를 덜어 주어 편리한",
      "The location is convenient because it's close to my office.",
    ],
    [
      "within walking distance",
      "걸어서 갈 수 있는 거리에",
      "The pool is within walking distance of my apartment.",
    ],
    [
      "for example",
      "구체적인 예를 들면",
      "There are free classes. For example, I took a cooking class last week.",
      "for instance",
    ],
    [
      "worth it",
      "들인 돈이나 수고만큼 가치가 있는",
      "The seats cost extra, but the view was worth it.",
    ],
    [
      "instead",
      "다른 선택을 대신해서",
      "The gym was closed, so I went for a walk instead.",
    ],
    [
      "recommend",
      "다른 사람에게 좋다고 추천하다",
      "I'd recommend the morning class if you like small groups.",
    ],
    [
      "similar",
      "완전히 같지는 않아도 서로 비슷한",
      "My friend's apartment is similar to mine, but it has a bigger kitchen.",
    ],
    [
      "choice",
      "여러 가능성 중에서 하는 선택",
      "For me, the train is the easiest choice.",
    ],
  ]),
  level("IM3", "경험을 순서대로 들려주기", [
    [
      "at first",
      "일이 막 시작됐을 때는, 처음에는",
      "At first, I thought I was on the right bus.",
    ],
    [
      "afterward",
      "앞서 말한 일이 끝난 뒤에",
      "We watched the game and went out for noodles afterward.",
      "afterwards",
    ],
    [
      "suddenly",
      "예고 없이 갑자기",
      "Suddenly, the music stopped and everyone looked up.",
    ],
    [
      "realize",
      "모르던 사실을 깨닫다",
      "I didn't realize my ticket was for the next day.",
    ],
    [
      "notice",
      "보거나 듣고 변화를 알아차리다",
      "I didn't notice the sign until I reached the door.",
    ],
    [
      "luckily",
      "운이 좋게도",
      "Luckily, a neighbor had a spare key.",
      "fortunately",
    ],
    [
      "eventually",
      "여러 일을 거친 끝에 결국",
      "We eventually found the little shop my aunt remembered.",
    ],
    [
      "memorable",
      "오래 기억에 남을 만한",
      "Getting lost together made that trip memorable.",
    ],
    [
      "used to",
      "예전에는 자주 그렇게 하곤 했다",
      "I used to ride my bike to school, even in winter.",
    ],
    [
      "these days",
      "예전과 비교해 요즘에는",
      "These days, I go there mostly to see old friends.",
    ],
  ]),
  level("IH", "예상 밖의 상황과 대처 설명하기", [
    [
      "unexpected",
      "미리 예상하지 못한",
      "An unexpected storm cut our hike short.",
    ],
    [
      "run out of",
      "쓰던 물건이나 시간이 다 떨어지다",
      "We didn't expect to run out of water so early in the hike.",
    ],
    [
      "figure out",
      "생각하거나 살펴서 방법을 알아내다",
      "I had to figure out how to get home after the last train.",
    ],
    [
      "in the meantime",
      "다른 일이 진행되거나 끝나기를 기다리는 그동안",
      "The host checked our booking. In the meantime, we called a nearby hotel.",
    ],
    [
      "alternative",
      "원래 계획을 대신할 수 있는 대안",
      "The clerk offered an alternative when our train was canceled.",
    ],
    [
      "fortunately",
      "나쁜 결과를 피해서 다행히도",
      "Fortunately, the last bus hadn't left yet.",
      "luckily",
    ],
    [
      "relieved",
      "걱정하던 일이 풀려 안도한",
      "I was relieved when the driver found my bag.",
    ],
    [
      "manage to",
      "어려움에도 어떻게든 해내다",
      "Did you manage to reach the owner before the shop closed?",
    ],
    [
      "turn out",
      "나중에 사실이나 결과가 드러나다",
      "Things didn't turn out the way we expected, but we still had fun.",
    ],
    [
      "make up for",
      "불편이나 손해를 다른 것으로 만회하다",
      "They offered us breakfast to make up for the long wait.",
    ],
  ]),
  level("AL", "변화의 영향과 해결 과정 풀어내기", [
    [
      "gradually",
      "시간이 흐르면서 조금씩, 점차",
      "As more families moved in, the empty lots gradually became playgrounds.",
    ],
    [
      "whereas",
      "두 상황을 대조할 때 쓰는 ‘반면에’",
      "I can walk to work now, whereas I used to spend an hour on the bus.",
    ],
    [
      "trade-off",
      "한 가지 이점을 얻으려 다른 이점을 포기하는 절충",
      "For us, the trade-off was a smaller kitchen in exchange for a shorter commute.",
    ],
    [
      "drawback",
      "좋은 점과 함께 따르는 단점",
      "The only drawback was the noise from the street, so we chose a room at the back.",
    ],
    [
      "adapt",
      "달라진 환경이나 상황에 적응하다",
      "It took us a few weeks to adapt to the new closing time.",
    ],
    [
      "disruption",
      "평소대로 진행되던 일이 중단되거나 차질이 생기는 것",
      "The road closure caused so much disruption that our shop started delivering orders.",
    ],
    [
      "resolve",
      "문제나 갈등을 해결하다",
      "We met the neighbors in person to resolve the parking issue.",
    ],
    [
      "compromise",
      "서로 조금씩 양보해 이르는 타협",
      "We reached a compromise and moved the noisy rehearsals to Saturday afternoons.",
    ],
    [
      "in hindsight",
      "일이 끝난 뒤 되돌아보면",
      "In hindsight, calling the host first would have saved us a second trip.",
    ],
    [
      "ever since",
      "과거의 그때부터 지금까지 줄곧",
      "I missed the last train once. Ever since then, I've checked the timetable before going out.",
    ],
  ]),
];
