import {
  calculateBloodFreshness,
  enforceStepBoundary,
  getCurrentStepProgress,
} from '@/lib/biosync/engine'
import { fail, getStateOrFail, ok, unknownError } from '@/lib/biosync/api'
import { addBloodReport } from '@/lib/biosync/store'
import { storeBloodReportFile } from '@/lib/storage/file-storage'

export const runtime = 'nodejs'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params
    const lookup = await getStateOrFail(userId)
    if (lookup.response) {
      return lookup.response
    }

    const boundary = enforceStepBoundary(lookup.state, 2)
    if (!boundary.ok) {
      return fail(boundary.reason ?? 'Step boundary violation.', 409, {
        requiredStep: boundary.requiredStep,
        currentStep: getCurrentStepProgress(lookup.state),
      })
    }

    const formData = await request.formData()
    const reportDate = String(formData.get('reportDate') ?? '')
    const filePart = formData.get('file')

    if (!reportDate) {
      return fail('reportDate is required.', 400)
    }

    if (!(filePart instanceof File)) {
      return fail('A PDF file is required.', 400)
    }

    if (filePart.size > MAX_FILE_SIZE_BYTES) {
      return fail('File exceeds 10 MB limit.', 400)
    }

    const fileType = filePart.type.toLowerCase()
    if (fileType !== 'application/pdf' && !filePart.name.toLowerCase().endsWith('.pdf')) {
      return fail('Only PDF files are allowed.', 400)
    }

    const storedFile = await storeBloodReportFile(userId, filePart)

    const report = await addBloodReport(lookup.state, {
      source: 'pdf',
      reportDate,
      pdfFileName: filePart.name,
      pdfUrl: storedFile.url,
    })

    const freshness = calculateBloodFreshness(report)

    return ok(
      {
        report,
        freshness,
        storage: {
          fileName: storedFile.fileName,
          url: storedFile.url,
        },
        currentStep: getCurrentStepProgress(lookup.state),
        nextStep: 3,
        note: 'PDF blood report uploaded. Add parsed biomarkers to unlock Step 3 analysis.',
      },
      201
    )
  } catch (error) {
    return unknownError(error)
  }
}
