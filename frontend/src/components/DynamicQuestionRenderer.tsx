'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface Question {
  id: string;
  field: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';
  label: string;
  description?: string;
  required: boolean;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface DynamicQuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
}

export function DynamicQuestionRenderer({
  question,
  value,
  onChange,
}: DynamicQuestionRendererProps) {
  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  switch (question.type) {
    case 'text':
    case 'date':
      return (
        <div className="space-y-2">
          <Label htmlFor={question.id}>
            {question.label}
            {question.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {question.description && (
            <p className="text-sm text-muted-foreground">{question.description}</p>
          )}
          <Input
            id={question.id}
            type={question.type}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={question.required}
            minLength={question.validation?.min}
            maxLength={question.validation?.max}
            pattern={question.validation?.pattern}
            className="mt-2"
          />
        </div>
      );

    case 'number':
      return (
        <div className="space-y-2">
          <Label htmlFor={question.id}>
            {question.label}
            {question.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {question.description && (
            <p className="text-sm text-muted-foreground">{question.description}</p>
          )}
          <Input
            id={question.id}
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value ? parseFloat(e.target.value) : '')}
            required={question.required}
            min={question.validation?.min}
            max={question.validation?.max}
            className="mt-2"
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={question.id}>
            {question.label}
            {question.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {question.description && (
            <p className="text-sm text-muted-foreground">{question.description}</p>
          )}
          <Textarea
            id={question.id}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={question.required}
            className="mt-2 min-h-[120px]"
          />
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={question.id}>
            {question.label}
            {question.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {question.description && (
            <p className="text-sm text-muted-foreground">{question.description}</p>
          )}
          <Select value={value || ''} onValueChange={handleChange} required={question.required}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'boolean':
      return (
        <div className="space-y-2">
          <div className="flex items-start space-x-3">
            <Checkbox
              id={question.id}
              checked={value === true}
              onCheckedChange={(checked) => handleChange(checked === true)}
              required={question.required}
            />
            <div className="flex-1">
              <Label htmlFor={question.id} className="font-normal cursor-pointer">
                {question.label}
                {question.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {question.description && (
                <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
              )}
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label>{question.label}</Label>
          <Input
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={question.required}
          />
        </div>
      );
  }
}

