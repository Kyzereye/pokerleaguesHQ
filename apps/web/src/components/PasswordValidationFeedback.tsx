import { checkPassword } from "../utils/password";

interface PasswordValidationFeedbackProps {
  password: string;
  confirm: string;
}

export default function PasswordValidationFeedback({ password, confirm }: PasswordValidationFeedbackProps) {
  const reqs = checkPassword(password);
  return (
    <>
      <ul className="requirements">
        <li className={reqs.length ? "met" : ""}>At least 8 characters</li>
        <li className={reqs.upper ? "met" : ""}>One uppercase letter</li>
        <li className={reqs.lower ? "met" : ""}>One lowercase letter</li>
        <li className={reqs.number ? "met" : ""}>One number</li>
        {password && confirm && password !== confirm && <li className="error">Passwords do not match</li>}
        {password && confirm && password === confirm && <li className="success">Passwords match</li>}
      </ul>
    </>
  );
}
