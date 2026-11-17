import { ArrowRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Grid, GridItem } from "@/components/layout/stack";
import { PageHeader } from "@/components/layout/page";
import { ConnectionSettings } from "@/components/connection-settings";
import type { SessionInfo } from "@/lib/types";

export function SettingsPage({
  session,
  busy,
  onChange,
  onConnect,
  onLogout,
  onHistory,
}: {
  session: SessionInfo | null;
  busy: boolean;
  onChange: (session: SessionInfo) => void;
  onConnect: () => void;
  onLogout: () => void;
  onHistory: () => void;
}) {
  return (
    <div className="page-stack">
      <PageHeader
        title="계정 및 설정"
        description="계정 연결과 평가 모델, 녹음 보관 설정을 확인하세요."
      />
      <Grid>
        <GridItem span={8}>
          <div className="space-y-6">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>계정</CardTitle>
                <CardDescription>현재 연결된 학습 계정입니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {session?.user ? (
                  <>
                    <dl className="summary-list">
                      <div>
                        <dt>이름</dt>
                        <dd>{session.user.name}</dd>
                      </div>
                      <div>
                        <dt>이메일</dt>
                        <dd>{session.user.email || "로컬 체험 계정"}</dd>
                      </div>
                      <div>
                        <dt>연결 방식</dt>
                        <dd>{session.user.demo ? "체험 계정" : "ChatGPT"}</dd>
                      </div>
                    </dl>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={onLogout}
                    >
                      <LogOut />
                      로그아웃
                    </Button>
                  </>
                ) : (
                  <Button onClick={onConnect}>
                    ChatGPT 구독 연결
                    <ArrowRight />
                  </Button>
                )}
              </CardContent>
            </Card>
            <ConnectionSettings
              session={session}
              onChange={onChange}
              onConnect={onConnect}
            />
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>녹음과 개인정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                <p>
                  녹음과 시험 기록은 현재 PC에 보관하며, 연결한 계정에서 확인할
                  수 있습니다. 브라우저 자동 전사는 브라우저 공급자의 음성 인식
                  서비스를 사용할 수 있습니다.
                </p>
                <p>
                  AI 평가를 요청하면 질문과 전사문을 OpenAI에 전송하고 본인
                  ChatGPT 구독 사용량을 사용합니다. GPT 음성 전사는 별도 전사
                  API 키를 설정하고 전송에 동의했을 때만 실행합니다.
                </p>
                <p>
                  학습 기록에서 시험을 삭제하면 해당 녹음 파일도 함께
                  삭제합니다.
                </p>
                <Button variant="outline" onClick={onHistory}>
                  학습 기록 관리
                  <ArrowRight />
                </Button>
              </CardContent>
            </Card>
          </div>
        </GridItem>
        <GridItem span={4}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>연결 상태</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <dl className="summary-list">
                <div>
                  <dt>앱 실행</dt>
                  <dd>
                    <Badge variant="secondary">
                      {session?.authMode === "local" ? "로컬" : "서비스"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt>구독 사용</dt>
                  <dd>{session?.sharing ? "허용됨" : "연결 대기"}</dd>
                </div>
                <div>
                  <dt>음성 전사 API</dt>
                  <dd>
                    {session?.transcriptionConfigured ? "설정됨" : "미설정"}
                  </dd>
                </div>
              </dl>
              <p className="text-xs leading-5 text-muted-foreground">
                로컬 연결은 이 PC에서 사용합니다. 여러 방문자가 사용하는 원격
                서비스는 별도 연동 승인이 필요합니다.
              </p>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </div>
  );
}
