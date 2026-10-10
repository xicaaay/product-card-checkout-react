import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormField } from './FormField'

describe('FormField', () => {
  it('associates the label with the input', () => {
    render(<FormField id="email" label="Correo" error={null} />)

    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
  })

  it('has no error state when there is no error', () => {
    render(<FormField id="email" label="Correo" error={null} />)

    expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByLabelText('Correo')).not.toHaveAttribute('aria-describedby')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('announces the error and links it to the input', () => {
    render(<FormField id="email" label="Correo" error="Correo inválido" />)

    const input = screen.getByLabelText('Correo')
    expect(screen.getByRole('alert')).toHaveTextContent('Correo inválido')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Correo inválido')
  })

  it('forwards input props such as value and onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FormField id="email" label="Correo" error={null} value="" onChange={onChange} />)

    await user.type(screen.getByLabelText('Correo'), 'a')

    expect(onChange).toHaveBeenCalledOnce()
  })

  it('renders the adornment', () => {
    render(<FormField id="email" label="Correo" error={null} adornment={<span>extra</span>} />)

    expect(screen.getByText('extra')).toBeInTheDocument()
  })
})
