import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MapPin, Mail, Phone, Calendar, Briefcase, GraduationCap, Heart, Code, BookOpen } from 'lucide-react';

export default function About() {
  const skills = [
    'React', 'TypeScript', 'Python', 'Machine Learning', 'Deep Learning', 
    'Computer Vision', 'LLM', 'VTON', 'Stock Analysis', 'Data Science'
  ];

  const experiences = [
    {
      title: '연구원',
      company: '연구소/대학',
      period: '2020 - 현재',
      description: 'AI/ML 연구 및 논문 작성'
    },
    {
      title: '개발자',
      company: '이전 회사',
      period: '2018 - 2020',
      description: '웹 개발 및 데이터 분석'
    }
  ];

  const education = [
    {
      degree: '박사과정 (진행중)',
      school: '대학교',
      field: 'Computer Science',
      period: '2021 - 현재'
    },
    {
      degree: '석사',
      school: '대학교',
      field: 'Computer Science',
      period: '2019 - 2021'
    },
    {
      degree: '학사',
      school: '대학교',
      field: 'Computer Science',
      period: '2015 - 2019'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2>About Me</h2>
        <p className="text-muted-foreground">김준광의 이력과 소개</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src="/api/placeholder/96/96" />
              <AvatarFallback>김준광</AvatarFallback>
            </Avatar>
            <CardTitle>김준광</CardTitle>
            <p className="text-muted-foreground">AI 연구자 & 개발자</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              rlawnsrhkd@gmail.com
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              대한민국, 서울
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-red-500" />
              기혼 (스똥시와 함께, 자몽이 아빠)
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                소개
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed">
                안녕하세요! AI 연구와 개발에 관심이 많은 김준광입니다. 
                특히 VTON(Virtual Try-On), LLM(Large Language Model), 그리고 주식 분석 분야에서 
                연구하고 있습니다. 사랑하는 아내 스똥시와 함께 자몽이를 키우며 
                행복한 가정을 꾸리고 있습니다.
              </p>
              <br />
              <p className="leading-relaxed">
                연구와 개발 외에도 여행을 좋아하고, 효율적인 시간 관리를 위해 
                뽀모도로 기법을 활용하고 있습니다. 이 웹사이트는 제 일상과 
                연구 활동을 기록하기 위해 만들었습니다.
              </p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                기술 스택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Experience & Education */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              경력
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {experiences.map((exp, index) => (
                <div key={index} className="border-l-2 border-muted pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4>{exp.title}</h4>
                      <p className="text-sm">{exp.company}</p>
                      <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {exp.period}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              학력
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="border-l-2 border-muted pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4>{edu.degree}</h4>
                      <p className="text-sm">{edu.school}</p>
                      <p className="text-xs text-muted-foreground mt-1">{edu.field}</p>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {edu.period}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Research Interests */}
      <Card>
        <CardHeader>
          <CardTitle>연구 관심 분야</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="flex items-center gap-2 mb-2">
                <span>👕</span>
                VTON (Virtual Try-On)
              </h4>
              <p className="text-sm text-muted-foreground">
                가상 의류 착용 기술 연구
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="flex items-center gap-2 mb-2">
                <span>🤖</span>
                LLM (Large Language Model)
              </h4>
              <p className="text-sm text-muted-foreground">
                대규모 언어 모델 연구 및 응용
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="flex items-center gap-2 mb-2">
                <span>📈</span>
                주식 분석
              </h4>
              <p className="text-sm text-muted-foreground">
                AI를 활용한 주식 시장 분석
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>개인 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-red-500" />
                가족
              </h5>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 아내: 스똥시</li>
                <li>• 아들: 자몽이</li>
              </ul>
            </div>
            <div>
              <h5 className="mb-2">취미</h5>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 여행</li>
                <li>• 연구 논문 읽기</li>
                <li>• 시간 관리 (뽀모도로)</li>
                <li>• 가계부 작성</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}