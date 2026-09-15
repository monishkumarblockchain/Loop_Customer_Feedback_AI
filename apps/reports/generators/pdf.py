from io import BytesIO
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from apps.feedback.models import Feedback

def feedback_pdf(company_id):
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setTitle("LOOP Feedback Report")
    y = 800
    pdf.drawString(40, y, f"LOOP Feedback Report - Company {company_id}")
    y -= 30
    for f in Feedback.objects.filter(company_id=company_id)[:30]:
        line = f"{f.title} | {f.sentiment} | {f.priority} | {f.rating}/5"
        pdf.drawString(40, y, line[:110])
        y -= 18
        if y < 50:
            pdf.showPage()
            y = 800
    pdf.save()
    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="loop-feedback-{company_id}.pdf"'
    return response
