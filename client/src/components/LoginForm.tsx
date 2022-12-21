import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";

const loginForm = () => {
  const loginSchema = yup.object().shape({
    email: yup
      .string()
      .required("Please enter email")
      .matches(/[a-z0-9]+@[a-z]+\.[a-z]{2,3}/, "Invalid Email"),
    password: yup
      .string()
      .required("Please enter password")
      .matches(/[\x20-\x7E]+/),
  });
  return (
    <div>
      <Formik
        initialValues={{
          email: "",
          password: "",
        }}
        validationSchema={loginSchema}
        onSubmit={(values, actions) => {
          console.log(values, actions);
          actions.setSubmitting(false);
        }}
      >
        <Form>
            <label htmlFor="email" className="hidden">Email</label>
            <Field id="email" name="email" type="email" placeholder="Email" className="border-blue-500 border-2" />
            <label htmlFor="password" className="hidden">Password</label>
            <Field id="password" name="password" type="password" placeholder="Password" />
        </Form>
      </Formik>
    </div>
  );
};

export default loginForm;
