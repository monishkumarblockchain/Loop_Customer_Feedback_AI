from django.core.management.base import BaseCommand

from apps.feedback.models import Feedback

from apps.chatbot.vectorstore import get_vector_store

BATCH_SIZE = 200


class Command(BaseCommand):
    help = (
        "Embed all customer feedback into the pgvector store used by the "
        "chatbot's semantic search tool. Safe to re-run: each feedback "
        "row is upserted by its id, so this can be scheduled (e.g. "
        "nightly via Celery beat) to pick up new/edited feedback."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--company-id",
            type=int,
            default=None,
            help="Only (re)index feedback for one company.",
        )

    def handle(self, *args, **options):
        from langchain_core.documents import Document

        company_id = options.get("company_id")

        queryset = Feedback.objects.select_related("company", "product").order_by(
            "id"
        )
        if company_id:
            queryset = queryset.filter(company_id=company_id)

        store = get_vector_store()

        total = queryset.count()
        self.stdout.write(f"Indexing {total} feedback rows...")

        indexed = 0
        batch_docs, batch_ids = [], []

        for item in queryset.iterator(chunk_size=BATCH_SIZE):
            text = f"{item.title or ''}\n{item.content or ''}".strip()
            if not text:
                continue

            doc = Document(
                page_content=text,
                metadata={
                    "feedback_id": item.id,
                    "company_id": item.company_id,
                    "company_name": item.company.name if item.company else None,
                    "product_name": item.product.name if item.product else None,
                    "rating": item.rating,
                    "sentiment": item.sentiment,
                    "category": item.category,
                },
            )

            batch_docs.append(doc)
            batch_ids.append(str(item.id))

            if len(batch_docs) >= BATCH_SIZE:
                store.add_documents(batch_docs, ids=batch_ids)
                indexed += len(batch_docs)
                self.stdout.write(f"  ...{indexed}/{total}")
                batch_docs, batch_ids = [], []

        if batch_docs:
            store.add_documents(batch_docs, ids=batch_ids)
            indexed += len(batch_docs)

        self.stdout.write(self.style.SUCCESS(f"Indexed {indexed} feedback rows."))
