import { ArrowRight, ExternalLink } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, PageSection } from "@/components/layout/page";
import { Grid, GridItem } from "@/components/layout/stack";
import { TYPE_LABELS } from "@/lib/types";

const functions: Record<string, string> = {
  intro: "자신과 일상을 자연스럽게 소개",
  description: "장소·사람·사물의 특징을 구체적으로 설명",
  routine: "반복하는 행동과 순서를 전달",
  past: "사건의 배경·전개·결과를 연결",
  comparison: "과거와 현재의 차이와 변화의 이유 설명",
  roleplay: "상황에 맞게 정보를 얻는 질문 만들기",
  solution: "문제를 설명하고 실행 가능한 대안 제시",
  opinion: "생각을 이유와 사례로 뒷받침",
};
const faqs = [
  {
    q: "문항마다 답변 시간이 정해져 있나요?",
    a: "각 문항별 제한은 없고 본시험 전체가 40분입니다. 질문을 듣는 시간과 난이도 재선택도 앱의 전체 시간에 포함합니다.",
  },
  {
    q: "선택한 설문에서만 문제가 나오나요?",
    a: "설문은 개인화에 쓰이지만 선택하지 않은 주제도 나올 수 있습니다. 앱도 생활 속 돌발 주제를 함께 구성합니다.",
  },
  {
    q: "어려운 난이도를 고르면 높은 등급을 받나요?",
    a: "난이도 선택만으로 등급이 결정되지 않습니다. 질문이 요구하는 기능을 얼마나 안정적으로 수행하는지가 중요합니다.",
  },
  {
    q: "AI가 실제 OPIc처럼 채점하나요?",
    a: "실제 시험은 공인 평가자가 전체 발화를 종합 평가합니다. 앱의 AI 평가는 전사문을 바탕으로 한 학습 피드백이며, 발음·억양·발화 속도는 판단하지 않습니다. 실제 등급을 보장하거나 공인 평가를 대체할 수 없습니다.",
  },
  {
    q: "실제 시험과 앱은 어떤 차이가 있나요?",
    a: "앱의 문제·인터뷰어·음성은 자체 구성입니다. 문항 수 직접 선택, 점검 시간 초과 허용, 명시적인 답변 시작 버튼, 종료 후 전사 수정은 학습을 위한 기능입니다. 공식 출제 알고리즘과 실제 화면을 복제하지 않습니다.",
  },
  {
    q: "시험 성적은 언제 나오나요?",
    a: "한국 공식 안내는 일반적으로 응시일 5일 후 발표를 안내합니다. 회차별 조기 발표와 일정은 공식 홈페이지를 확인해 주세요. 앱의 피드백은 공식 성적과 무관합니다.",
  },
];
const sources = [
  {
    title: "한국 OPIc 공식 시험 안내",
    url: "https://www.opic.co.kr/opics/jsp/senior/receipt/aboutOpicMobile.jsp",
  },
  {
    title: "ACTFL OPIc Familiarization Guide",
    url: "https://www.actfl.org/uploads/files/general/OPIc_Familiarization_Guide.pdf",
  },
  {
    title: "LTI · About OPIc",
    url: "https://www.languagetesting.com/oral-proficiency-interview-by-computer-opic",
  },
  {
    title: "ACTFL · 수험생 준비 안내",
    url: "https://www.actfl.org/assessments/postsecondary-assessments/opi/tips-for-opi-and-opic-test-takers",
  },
];
export function TestGuide({ onStart }: { onStart: () => void }) {
  return (
    <div className="page-stack">
      <PageHeader
        title="시험 가이드"
        description="공식 진행 절차와 평가 방식을 이해하고 같은 순서로 연습하세요."
        actions={
          <Button onClick={onStart}>
            모의시험 시작
            <ArrowRight />
          </Button>
        }
      />
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>시험 진행 순서</CardTitle>
            <Badge variant="secondary">
              오리엔테이션 약 20분 + 본시험 40분
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="guide-process">
            {[
              { title: "배경 설문", text: "일상과 관심사 선택" },
              { title: "자기평가", text: "초기 난이도 선택" },
              { title: "장비 점검", text: "듣기·녹음 확인" },
              { title: "1차 세션", text: "약 7문항" },
              { title: "난이도 재선택", text: "쉬움·비슷함·어려움" },
              { title: "2차 세션", text: "약 5~8문항" },
            ].map((step, i) => (
              <li className="space-y-3" key={step.title}>
                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {i + 1}
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
      <Grid>
        <GridItem span={8}>
          <div className="space-y-8">
            <PageSection
              title="문제 유형"
              description="유형별 학습 분류이며, 실제 시험의 고정된 출제 순서는 아닙니다."
            >
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32 px-6">유형</TableHead>
                      <TableHead className="px-6">연습할 능력</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(TYPE_LABELS).map(([id, label]) => (
                      <TableRow key={id}>
                        <TableCell className="px-6 py-4 font-medium">
                          {label}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-normal text-muted-foreground">
                          {functions[id]}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </PageSection>
            <PageSection title="자주 묻는 질문">
              <Accordion type="single" collapsible>
                {faqs.map((faq, i) => (
                  <AccordionItem value={`faq-${i}`} key={faq.q}>
                    <AccordionTrigger className="text-sm">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="leading-7 text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </PageSection>
          </div>
        </GridItem>
        <GridItem span={4}>
          <div className="space-y-6">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>종합 평가 영역</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { title: "수행 기능", text: "설명·질문·서술·문제 해결" },
                  { title: "내용과 맥락", text: "질문에 맞는 구체적인 내용" },
                  {
                    title: "정확성과 이해 가능성",
                    text: "의미를 전달하는 표현",
                  },
                  { title: "발화 구성", text: "문장과 이야기의 연결" },
                ].map((item) => (
                  <div className="space-y-1" key={item.title}>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <PageSection title="공식 참고 자료">
              <div className="divide-y rounded-lg border">
                {sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start justify-between gap-3 p-4 text-sm leading-6 hover:bg-muted/50"
                  >
                    {source.title}
                    <ExternalLink className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                제공해 주신 80쪽 가이드의 설문·주제별 학습·롤플레이 흐름도
                참고했습니다. 오래된 행정 정보는 현재 공식 안내를 우선합니다.
              </p>
            </PageSection>
          </div>
        </GridItem>
      </Grid>
    </div>
  );
}
