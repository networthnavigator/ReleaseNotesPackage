import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (value == null || value === '') return this.sanitizer.bypassSecurityTrustHtml('');
    const html = marked.parse(value, { async: false });
    return this.sanitizer.bypassSecurityTrustHtml(typeof html === 'string' ? html : '');
  }
}
